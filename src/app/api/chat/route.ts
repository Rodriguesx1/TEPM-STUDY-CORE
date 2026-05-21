import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { question } = (await request.json()) as { question?: string };
    if (!question?.trim()) return NextResponse.json({ error: "Pergunta obrigatoria." }, { status: 400 });

    const profileResult = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    const { data: profile } = profileResult.data
      ? profileResult
      : await supabase
      .from("users_profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: license } = await supabase
        .from("licenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .in("status", ["active", "trial", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Licenca ativa obrigatoria para usar IA." }, { status: 403 });
    }

    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content")
      .eq("user_id", auth.user.id)
      .limit(8);

    const context = chunks?.map((chunk) => chunk.content).join("\n\n---\n\n") || "Nenhum material processado encontrado.";
    const prompt = [
      "Voce e a Mentora IA do TEPM Study Core.",
      "Responda em portugues, com cuidado terapeutico, sem prometer diagnostico medico.",
      "Use apenas o contexto autorizado do usuario quando ele existir.",
      `Contexto:\n${context}`,
      `Pergunta:\n${question}`,
    ].join("\n\n");

    const result = await answerWithFallback(prompt);
    await supabase.from("audit_logs").insert({
      user_id: auth.user.id,
      action: isAdmin ? `chat.${result.provider}.admin_unlimited` : `chat.${result.provider}`,
      entity_type: "ai",
    });
    return NextResponse.json({ answer: result.answer, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no chat IA." }, { status: 500 });
  }
}
