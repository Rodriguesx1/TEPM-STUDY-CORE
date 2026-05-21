import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { awardStudyPoints } from "@/lib/gamification/service";
import { isLicenseActive } from "@/lib/licenses/guards";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

const taskPoints: Record<string, number> = {
  study: 15,
  review: 20,
  goal: 25,
  therapy_session: 30,
  automation: 10,
};

function isPremiumAllowed(context: NonNullable<Awaited<ReturnType<typeof getSessionContext>>>) {
  return context.isAdmin || isLicenseActive(context.license);
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 240) || fallback : fallback;
}

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const supabase = await getServerSupabase();
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - 15);
  const periodEnd = new Date(now);
  periodEnd.setDate(now.getDate() + 45);

  const [events, tasks, goals, points, streak, achievements, recentDocuments, recentVideos] = await Promise.all([
    supabase
      .from("study_events")
      .select("*")
      .eq("user_id", context.userId)
      .gte("starts_at", periodStart.toISOString())
      .lte("starts_at", periodEnd.toISOString())
      .order("starts_at", { ascending: true }),
    supabase.from("study_tasks").select("*").eq("user_id", context.userId).order("due_at", { ascending: true }).limit(80),
    supabase.from("study_goals").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("user_points").select("*").eq("user_id", context.userId).maybeSingle(),
    supabase.from("study_streaks").select("*").eq("user_id", context.userId).maybeSingle(),
    supabase
      .from("user_achievements")
      .select("id,earned_at,metadata,achievements(id,code,title,description,points_required)")
      .eq("user_id", context.userId)
      .order("earned_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id,title,summary,theme,created_at")
      .eq("user_id", context.userId)
      .eq("status", "processed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("videos")
      .select("id,title,summary,created_at")
      .eq("user_id", context.userId)
      .eq("status", "processed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const suggestions = [
    ...(recentDocuments.data ?? []).map((document) => ({
      type: "review",
      source_type: "document",
      source_id: document.id,
      title: `Revisar PDF: ${document.title}`,
      description: document.summary ?? "Revisao guiada a partir do PDF processado.",
    })),
    ...(recentVideos.data ?? []).map((video) => ({
      type: "review",
      source_type: "video",
      source_id: video.id,
      title: `Revisar video: ${video.title}`,
      description: video.summary ?? "Revisao guiada a partir da transcricao do video.",
    })),
  ].slice(0, 6);

  return NextResponse.json({
    events: events.data ?? [],
    tasks: tasks.data ?? [],
    goals: goals.data ?? [],
    points: points.data ?? { user_id: context.userId, total_points: 0, level: 1 },
    streak: streak.data ?? { user_id: context.userId, current_streak: 0, longest_streak: 0 },
    achievements: achievements.data ?? [],
    suggestions,
    hasPremiumAccess: context.hasPremiumAccess,
  });
}

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!isPremiumAllowed(context)) return NextResponse.json({ error: "Licenca ativa obrigatoria para criar automacoes." }, { status: 402 });

  const payload = (await request.json()) as Record<string, unknown>;
  const action = cleanText(payload.action);
  const admin = getSupabaseAdmin();

  if (action === "task") {
    const title = cleanText(payload.title);
    if (!title) return NextResponse.json({ error: "Titulo da tarefa obrigatorio." }, { status: 400 });
    const taskType = cleanText(payload.taskType, "study");
    const dueAt = typeof payload.dueAt === "string" && payload.dueAt ? new Date(payload.dueAt).toISOString() : null;
    const { data, error } = await admin
      .from("study_tasks")
      .insert({
        user_id: context.userId,
        title,
        description: cleanText(payload.description),
        task_type: ["study", "review", "goal", "therapy_session", "automation"].includes(taskType) ? taskType : "study",
        priority: ["low", "medium", "high"].includes(cleanText(payload.priority)) ? cleanText(payload.priority) : "medium",
        due_at: dueAt,
        document_id: typeof payload.documentId === "string" ? payload.documentId : null,
        video_id: typeof payload.videoId === "string" ? payload.videoId : null,
      })
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "study_task.created", entity_type: "study_tasks", entity_id: data.id });
    return NextResponse.json({ task: data });
  }

  if (action === "event") {
    const title = cleanText(payload.title);
    if (!title) return NextResponse.json({ error: "Titulo do evento obrigatorio." }, { status: 400 });
    const startsAt = typeof payload.startsAt === "string" && payload.startsAt ? new Date(payload.startsAt).toISOString() : null;
    if (!startsAt) return NextResponse.json({ error: "Data do evento obrigatoria." }, { status: 400 });
    const eventType = cleanText(payload.eventType, "study");
    const { data, error } = await admin
      .from("study_events")
      .insert({
        user_id: context.userId,
        title,
        description: cleanText(payload.description),
        event_type: ["study", "review", "weekly_goal", "therapy_session", "license_alert"].includes(eventType) ? eventType : "study",
        starts_at: startsAt,
        ends_at: typeof payload.endsAt === "string" && payload.endsAt ? new Date(payload.endsAt).toISOString() : null,
      })
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "study_event.created", entity_type: "study_events", entity_id: data.id });
    return NextResponse.json({ event: data });
  }

  if (action === "goal") {
    const title = cleanText(payload.title);
    if (!title) return NextResponse.json({ error: "Titulo da meta obrigatorio." }, { status: 400 });
    const { data, error } = await admin
      .from("study_goals")
      .insert({
        user_id: context.userId,
        title,
        description: cleanText(payload.description),
        target_count: Math.max(1, Number(payload.targetCount) || 1),
        period_end: typeof payload.periodEnd === "string" && payload.periodEnd ? payload.periodEnd : undefined,
      })
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "study_goal.created", entity_type: "study_goals", entity_id: data.id });
    return NextResponse.json({ goal: data });
  }

  if (action === "weekly_plan") {
    const today = new Date();
    const tasks = Array.from({ length: 5 }).map((_, index) => {
      const due = new Date(today);
      due.setDate(today.getDate() + index);
      return {
        user_id: context.userId,
        title: ["Revisar PDFs recentes", "Conversar com a Mentora IA", "Criar perguntas de fixacao", "Atualizar caderno terapeutico", "Revisao geral da semana"][index],
        description: "Gerado automaticamente com base nos materiais e no fluxo semanal.",
        task_type: index === 1 ? "study" : "review",
        priority: index < 2 ? "high" : "medium",
        due_at: due.toISOString(),
        metadata: { generated_by: "weekly_plan" },
      };
    });
    const { data, error } = await admin.from("study_tasks").insert(tasks).select("*");
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "automation.weekly_plan.created", entity_type: "study_tasks", metadata: { count: data.length } });
    return NextResponse.json({ tasks: data });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const { taskId } = (await request.json()) as { taskId?: string };
  if (!taskId) return NextResponse.json({ error: "taskId obrigatorio." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: task, error: readError } = await admin
    .from("study_tasks")
    .select("id,user_id,task_type,status,title")
    .eq("id", taskId)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (readError) throw readError;
  if (!task) return NextResponse.json({ error: "Tarefa nao encontrada." }, { status: 404 });
  if (task.status === "completed") return NextResponse.json({ task });

  const points = taskPoints[String(task.task_type)] ?? 10;
  const { data, error } = await admin
    .from("study_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString(), points_awarded: points, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", context.userId)
    .select("*")
    .single();
  if (error) throw error;
  await awardStudyPoints(admin, { userId: context.userId, points, reason: "task_completed", metadata: { task_id: taskId, task_type: task.task_type } });
  return NextResponse.json({ task: data, points });
}
