import { NextResponse } from "next/server";
import { answerWithFallback, parseAiJson } from "@/lib/ai/providers";
import { buildLocalRecommendations } from "@/lib/intelligence/memory";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Recommendation = { title: string; reason: string; priority: string; action: string };

async function seedRevisionQueue(admin: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const pending = await admin.from("revision_queue").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending");
  if ((pending.count ?? 0) > 0) return;

  const docs = await admin
    .from("documents")
    .select("id,title,theme,summary,created_at")
    .eq("user_id", userId)
    .eq("status", "processed")
    .order("created_at", { ascending: false })
    .limit(5);
  if (docs.error || !docs.data?.length) return;

  await admin.from("revision_queue").insert(
    docs.data.map((doc, index) => ({
      user_id: userId,
      source_type: "document",
      source_id: doc.id,
      title: doc.title,
      theme: doc.theme,
      priority: index < 2 ? "high" : "medium",
      due_at: new Date(Date.now() + index * 86400000).toISOString(),
      retention_score: Math.max(35, 70 - index * 6),
      interval_days: index === 0 ? 1 : 3,
      metadata: { summary: doc.summary },
    })),
  );
}

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria." }, { status: 403 });

  const admin = getSupabaseAdmin();
  try {
    await seedRevisionQueue(admin, context.userId);
    const [
      memory,
      events,
      revisions,
      retention,
      patterns,
      studyPatterns,
      materials,
      costs,
      runs,
      documents,
      preferences,
    ] = await Promise.all([
      admin.from("user_memory").select("id,memory_type,title,content,confidence,last_seen_at").eq("user_id", context.userId).order("last_seen_at", { ascending: false }).limit(12),
      admin.from("memory_events").select("id,event_type,title,content,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(8),
      admin.from("revision_queue").select("id,title,theme,priority,due_at,status,retention_score,interval_days").eq("user_id", context.userId).eq("status", "pending").order("due_at", { ascending: true }).limit(10),
      admin.from("retention_scores").select("id,source_type,theme,score,last_reviewed_at,next_review_at").eq("user_id", context.userId).order("score", { ascending: true }).limit(10),
      admin.from("cognitive_patterns").select("id,pattern_type,title,description,severity,detected_at").eq("user_id", context.userId).order("detected_at", { ascending: false }).limit(8),
      admin.from("study_patterns").select("*").eq("user_id", context.userId).order("period_end", { ascending: false }).limit(4),
      admin.from("generated_materials").select("id,material_type,title,status,agent_name,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(8),
      admin.from("ai_cost_ledger").select("provider,estimated_cost_cents,prompt_tokens,completion_tokens,cached,created_at").eq("user_id", context.userId).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(200),
      admin.from("agent_runs").select("agent_name,task_type,status,provider,token_estimate,cost_estimate_cents,started_at").eq("user_id", context.userId).order("started_at", { ascending: false }).limit(12),
      admin.from("documents").select("id,title,theme,created_at").eq("user_id", context.userId).eq("status", "processed").order("created_at", { ascending: false }).limit(8),
      admin.from("ai_preferences").select("*").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (memory.error) throw memory.error;

    const recommendations = buildLocalRecommendations({
      documents: documents.data ?? [],
      revisions: revisions.data ?? [],
      memories: (memory.data ?? []).map((item) => ({ ...item, confidence: Number(item.confidence ?? 0) })),
    });
    const costTotal = (costs.data ?? []).reduce((sum, item) => sum + Number(item.estimated_cost_cents ?? 0), 0);
    const tokenTotal = (costs.data ?? []).reduce((sum, item) => sum + Number(item.prompt_tokens ?? 0) + Number(item.completion_tokens ?? 0), 0);

    return NextResponse.json({
      memory: memory.data ?? [],
      events: events.data ?? [],
      revisions: revisions.data ?? [],
      retention: retention.data ?? [],
      patterns: patterns.data ?? [],
      studyPatterns: studyPatterns.data ?? [],
      materials: materials.data ?? [],
      costs: { cents30d: costTotal, tokens30d: tokenTotal, cached: (costs.data ?? []).filter((item) => item.cached).length },
      runs: runs.data ?? [],
      recommendations,
      preferences: preferences.data ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar inteligencia." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria." }, { status: 403 });

  const admin = getSupabaseAdmin();
  const body = (await request.json().catch(() => ({}))) as { action?: string; materialType?: string; title?: string };

  try {
    if (body.action === "complete_revision") {
      const id = String(body.title ?? "");
      const revision = await admin.from("revision_queue").update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.userId).select("*").single();
      if (revision.error) throw revision.error;
      await admin.from("memory_events").insert({ user_id: context.userId, event_type: "revision.completed", source_type: "revision_queue", source_id: revision.data.id, title: revision.data.title, content: `Revisao concluida: ${revision.data.title}`, weight: 0.8 });
      return NextResponse.json({ ok: true });
    }

    const documents = await admin.from("documents").select("id,title,summary,theme").eq("user_id", context.userId).eq("status", "processed").order("created_at", { ascending: false }).limit(5);
    const contextText = (documents.data ?? []).map((doc) => `PDF: ${doc.title}\nTema: ${doc.theme ?? "Sem tema"}\nResumo: ${doc.summary ?? "Sem resumo"}`).join("\n\n");
    if (!contextText) return NextResponse.json({ error: "Processe PDFs antes de gerar materiais avancados." }, { status: 400 });

    const materialType = body.materialType ?? "resumo_premium";
    const prompt = [
      "Gere um material premium de estudo terapeutico com base somente nos materiais abaixo.",
      `Tipo solicitado: ${materialType}.`,
      "Retorne JSON valido com title, markdown, sections, questions e next_steps.",
      contextText,
    ].join("\n\n");
    const result = await answerWithFallback(prompt);
    const parsed = parseAiJson(result.answer, { title: body.title ?? "Material premium", markdown: result.answer, sections: [], questions: [], next_steps: [] });
    const inserted = await admin
      .from("generated_materials")
      .insert({
        user_id: context.userId,
        material_type: materialType,
        title: String(parsed.title ?? body.title ?? "Material premium"),
        source_type: "documents",
        content: parsed,
        markdown: String(parsed.markdown ?? result.answer),
        status: "ready",
        agent_name: "presentation_premium",
      })
      .select("*")
      .single();
    if (inserted.error) throw inserted.error;
    return NextResponse.json({ material: inserted.data, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na automacao inteligente." }, { status: 500 });
  }
}
