import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

type ChunkWithDocument = {
  content: string;
  documents?: { title?: string | null; theme?: string | null } | Array<{ title?: string | null; theme?: string | null }>;
};

function firstDocument(documents: ChunkWithDocument["documents"]) {
  return Array.isArray(documents) ? documents[0] : documents;
}

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { data: chunks, error } = await admin
      .from("document_chunks")
      .select("content,chunk_index,documents!inner(title,theme)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    if (!chunks?.length) return NextResponse.json({ error: "Envie e processe PDFs antes de gerar trilha." }, { status: 400 });

    const context = (chunks as ChunkWithDocument[])
      .map((chunk) => {
        const document = firstDocument(chunk.documents);
        return `PDF: ${document?.title ?? "Documento"}\nCategoria: ${document?.theme ?? "Sem categoria"}\n${chunk.content}`;
      })
      .join("\n\n---\n\n");
    const prompt = [
      "Crie uma trilha de estudos terapeuticos com base apenas nos materiais abaixo.",
      "Retorne em JSON valido com as chaves: title, description, modules, seven_day_plan, thirty_day_plan, review, fixation_questions, gaps.",
      "modules deve ser uma lista com title, priority, difficulty, documents e goals.",
      `Materiais:\n${context}`,
    ].join("\n\n");

    const result = await answerWithFallback(prompt);
    let modules: unknown[] = [];
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(result.answer.replace(/^```json|```$/g, "").trim()) as Record<string, unknown>;
      modules = Array.isArray(parsed.modules) ? parsed.modules : [];
    } catch {
      parsed = { raw: result.answer };
    }

    const created = await admin
      .from("study_paths")
      .insert({
        user_id: auth.user.id,
        title: String(parsed.title ?? "Trilha gerada com IA"),
        description: String(parsed.description ?? "Plano criado com base nos PDFs processados."),
        modules,
        status: "active",
      })
      .select("*")
      .single();
    if (created.error) throw created.error;

    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: `study_path.${result.provider}`, entity_type: "study_paths", entity_id: created.data.id });
    return NextResponse.json({ path: created.data, plan: parsed, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gerar trilha." }, { status: 500 });
  }
}
