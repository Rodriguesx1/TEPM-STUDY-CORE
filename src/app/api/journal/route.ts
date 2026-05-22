import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { answerWithFallback } from "@/lib/ai/providers";
import { hasSensitiveConsent, requireSensitiveConsent, safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  try {
    await requireSensitiveConsent(admin, context.userId, "emotional_journal");
  } catch {
    return NextResponse.json({ requiresConsent: true, entries: [], insights: [] });
  }

  const [entries, insights] = await Promise.all([
    admin.from("emotional_journal_entries").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(40),
    admin.from("journal_ai_insights").select("id,journal_entry_id,insight,provider,safety_note,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
  ]);
  return NextResponse.json({ requiresConsent: false, entries: entries.data ?? [], insights: insights.data ?? [] });
}

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  await requireSensitiveConsent(admin, context.userId, "emotional_journal");

  const payload = (await request.json()) as {
    title?: string;
    mood?: string;
    energyLevel?: number;
    tags?: string[];
    content?: string;
    dreams?: string;
    insights?: string;
    useForAi?: boolean;
    generateInsight?: boolean;
  };
  if (!payload.content?.trim()) return NextResponse.json({ error: "Texto do diario e obrigatorio." }, { status: 400 });

  const { data, error } = await admin
    .from("emotional_journal_entries")
    .insert({
      user_id: context.userId,
      title: payload.title?.slice(0, 120) || null,
      mood: payload.mood?.slice(0, 80) || null,
      energy_level: payload.energyLevel ? Math.min(5, Math.max(1, Number(payload.energyLevel))) : null,
      tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 12).map((tag) => tag.slice(0, 40)) : [],
      content: payload.content.slice(0, 8000),
      dreams: payload.dreams?.slice(0, 3000) || null,
      insights: payload.insights?.slice(0, 3000) || null,
      use_for_ai: Boolean(payload.useForAi),
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let aiInsight = null;
  const aiAllowed = payload.useForAi && payload.generateInsight && (await hasSensitiveConsent(admin, context.userId, "ai_sensitive_adaptation"));
  if (aiAllowed) {
    const prompt = [
      "Voce e uma mentora de estudos terapeuticos. Leia o diario privado abaixo apenas para gerar uma reflexao de estudo.",
      "Nao diagnostique, nao interprete sintomas como doenca, nao prometa previsoes clinicas.",
      "Responda em portugues com: acolhimento breve, proxima acao de estudo leve, pergunta de reflexao.",
      `Diario autorizado:\n${payload.content.slice(0, 2500)}`,
    ].join("\n\n");
    const result = await answerWithFallback(prompt);
    const inserted = await admin
      .from("journal_ai_insights")
      .insert({ user_id: context.userId, journal_entry_id: data.id, insight: result.answer.slice(0, 5000), provider: result.provider })
      .select("id,insight,provider,safety_note,created_at")
      .single();
    aiInsight = inserted.data;
  }

  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "journal.entry_created", status: "completed", metadata: safeSensitiveMetadata({ ai_used: Boolean(aiInsight) }) });
  return NextResponse.json({ entry: data, aiInsight });
}

export async function DELETE(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  const admin = getSupabaseAdmin();
  await requireSensitiveConsent(admin, context.userId, "emotional_journal");
  const { error } = await admin.from("emotional_journal_entries").delete().eq("id", id).eq("user_id", context.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "journal.entry_deleted", status: "completed", metadata: safeSensitiveMetadata() });
  return NextResponse.json({ ok: true });
}
