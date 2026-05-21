import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const supabase = await getServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [documents, videos, tasks, goals, messages, points, streak, studyPaths] = await Promise.all([
    supabase.from("documents").select("id,title,theme,themes,status,created_at,summary").eq("user_id", context.userId).order("created_at", { ascending: false }),
    supabase.from("videos").select("id,title,status,topics,created_at,summary").eq("user_id", context.userId).order("created_at", { ascending: false }),
    supabase.from("study_tasks").select("id,title,task_type,status,completed_at,due_at,points_awarded,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }),
    supabase.from("study_goals").select("id,title,target_count,current_count,status,period_start,period_end").eq("user_id", context.userId),
    supabase.from("ai_messages").select("id,role,created_at,sources").eq("user_id", context.userId).gte("created_at", since.toISOString()),
    supabase.from("user_points").select("*").eq("user_id", context.userId).maybeSingle(),
    supabase.from("study_streaks").select("*").eq("user_id", context.userId).maybeSingle(),
    supabase.from("study_paths").select("id,title,status,created_at").eq("user_id", context.userId),
  ]);

  const completedTasks = (tasks.data ?? []).filter((task) => task.status === "completed");
  const pendingTasks = (tasks.data ?? []).filter((task) => task.status === "pending");
  const processedDocs = (documents.data ?? []).filter((document) => document.status === "processed");
  const processedVideos = (videos.data ?? []).filter((video) => video.status === "processed");

  const themeCounts = new Map<string, number>();
  for (const document of processedDocs) {
    const themes = Array.isArray(document.themes) ? document.themes : document.theme ? [document.theme] : ["Sem categoria"];
    for (const theme of themes) themeCounts.set(String(theme), (themeCounts.get(String(theme)) ?? 0) + 1);
  }

  const weeklyEvolution = Array.from({ length: 4 }).map((_, index) => {
    const end = new Date();
    end.setDate(end.getDate() - index * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const completed = completedTasks.filter((task) => {
      if (!task.completed_at) return false;
      const completedAt = new Date(task.completed_at).getTime();
      return completedAt >= start.getTime() && completedAt <= end.getTime();
    }).length;
    return {
      label: `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
      completed,
    };
  }).reverse();

  const gaps = [
    processedDocs.length === 0 ? "Nenhum PDF processado para sustentar estudos e IA RAG." : null,
    processedVideos.length === 0 ? "Nenhum video transcrito ainda para complementar a memoria." : null,
    completedTasks.length === 0 ? "Nenhuma revisao concluida; crie tarefas no calendario para consolidar aprendizado." : null,
    (messages.data ?? []).filter((message) => message.role === "user").length < 3 ? "Pouco uso da Mentora IA nos ultimos 30 dias." : null,
    (studyPaths.data ?? []).length === 0 ? "Nenhuma trilha de estudo gerada para orientar a sequencia de conteudo." : null,
  ].filter(Boolean);

  const recommendations = [
    pendingTasks.length ? `Concluir ${pendingTasks.length} tarefa(s) pendente(s) antes de criar novos materiais.` : "Criar uma revisao semanal para manter consistencia.",
    processedDocs.length ? "Use a Mentora IA para gerar perguntas de fixacao dos PDFs mais recentes." : "Envie pelo menos um PDF autorizado para iniciar a memoria inteligente.",
    processedVideos.length ? "Revise os topicos dos videos e transforme os principais pontos em slides." : "Quando habilitar videos, transcreva uma aula curta para alimentar o RAG.",
  ];

  return NextResponse.json({
    metrics: {
      documentsProcessed: processedDocs.length,
      videosProcessed: processedVideos.length,
      tasksCompleted: completedTasks.length,
      tasksPending: pendingTasks.length,
      studyPaths: studyPaths.data?.length ?? 0,
      aiQuestions30d: (messages.data ?? []).filter((message) => message.role === "user").length,
      totalPoints: points.data?.total_points ?? 0,
      level: points.data?.level ?? 1,
      currentStreak: streak.data?.current_streak ?? 0,
      longestStreak: streak.data?.longest_streak ?? 0,
    },
    themes: Array.from(themeCounts.entries()).map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count),
    weeklyEvolution,
    gaps,
    recommendations,
    recentDocuments: processedDocs.slice(0, 5),
    recentVideos: processedVideos.slice(0, 5),
  });
}
