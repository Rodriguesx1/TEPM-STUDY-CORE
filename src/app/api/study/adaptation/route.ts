import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { estimateCyclePhase, studySuggestionForPhase, type CyclePhase } from "@/lib/sensitive/cycle";
import { hasSensitiveConsent } from "@/lib/sensitive/consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();

  const aiSensitiveAllowed = await hasSensitiveConsent(admin, context.userId, "ai_sensitive_adaptation");
  const cycleAllowed = await hasSensitiveConsent(admin, context.userId, "cycle_tracking");
  let phase: CyclePhase = "indefinida";
  let energyLevel: number | null = null;

  if (aiSensitiveAllowed && cycleAllowed) {
    const [profile, entry] = await Promise.all([
      admin.from("cycle_profiles").select("last_period_start,average_cycle_length,average_period_length").eq("user_id", context.userId).maybeSingle(),
      admin.from("cycle_entries").select("phase,energy_level").eq("user_id", context.userId).order("entry_date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    energyLevel = entry.data?.energy_level ?? null;
    phase = (entry.data?.phase as CyclePhase | null) ?? estimateCyclePhase(new Date(), profile.data?.last_period_start, profile.data?.average_cycle_length, profile.data?.average_period_length);
  }

  const [documents, tasks, revisions] = await Promise.all([
    admin.from("documents").select("id,title,theme,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(3),
    admin.from("study_tasks").select("id,title,due_at,status").eq("user_id", context.userId).eq("status", "pending").order("due_at", { ascending: true }).limit(5),
    admin.from("revision_queue").select("id,title,priority,next_review_at").eq("user_id", context.userId).order("next_review_at", { ascending: true }).limit(5),
  ]);

  const suggestion = studySuggestionForPhase(phase, energyLevel);
  const hasBacklog = (tasks.data?.length ?? 0) + (revisions.data?.length ?? 0) > 4;
  return NextResponse.json({
    sensitiveContextUsed: aiSensitiveAllowed && cycleAllowed,
    cyclePhase: aiSensitiveAllowed && cycleAllowed ? phase : null,
    energyLevel: aiSensitiveAllowed && cycleAllowed ? energyLevel : null,
    intensity: hasBacklog ? "organizada" : suggestion.intensity,
    nextAction: hasBacklog ? "Escolha uma pendencia pequena e conclua antes de abrir novo conteudo." : suggestion.nextAction,
    message: hasBacklog ? "Ha sinais de acumulacao. Um passo menor pode trazer mais clareza." : suggestion.message,
    documents: documents.data ?? [],
    tasks: tasks.data ?? [],
    revisions: revisions.data ?? [],
    medicalBoundary: "Sugestao de organizacao de estudos. Nao e diagnostico, previsao clinica ou orientacao medica.",
  });
}
