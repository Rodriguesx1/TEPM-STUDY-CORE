import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
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

    const { data: documents, error: documentsError } = await admin
      .from("documents")
      .select("id,title,summary,theme,status,created_at")
      .eq("user_id", auth.user.id)
      .eq("status", "processed")
      .order("created_at", { ascending: false })
      .limit(12);
    if (documentsError) throw documentsError;

    const documentIds = documents?.map((document) => document.id) ?? [];
    const { data: chunks, error: chunksError } = documentIds.length
      ? await admin
      .from("document_chunks")
          .select("document_id,chunk_index,content")
      .eq("user_id", auth.user.id)
          .in("document_id", documentIds)
          .order("chunk_index", { ascending: true })
          .limit(24)
      : { data: [], error: null };
    if (chunksError) throw chunksError;

    const documentSummary =
      documents
        ?.map((document) => {
          const relatedChunks = chunks?.filter((chunk) => chunk.document_id === document.id) ?? [];
          const content = relatedChunks.map((chunk) => chunk.content).join("\n\n");
          return [
            `PDF: ${document.title}`,
            `Categoria: ${document.theme ?? "Sem categoria"}`,
            document.summary ? `Resumo: ${document.summary}` : null,
            content ? `Conteudo extraido:\n${content}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n---\n\n") ?? "";

    const context = documentSummary || "Nenhum material processado encontrado.";
    const prompt = [
      "Voce e a Mentora IA do TEPM Study Core.",
      "Responda em portugues, com cuidado terapeutico, sem prometer diagnostico medico.",
      "Use o contexto autorizado do usuario como fonte principal.",
      "Se houver PDFs no contexto, nunca diga que nao recebeu ou nao tem PDFs armazenados.",
      "Quando perguntarem se voce conhece os PDFs, cite os titulos e categorias que aparecem no contexto.",
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
