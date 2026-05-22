import { NextResponse } from "next/server";
import { answerWithFallback } from "@/lib/ai/providers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const document = await admin.from("documents").select("id,title,theme,summary").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (document.error) throw document.error;
    if (!document.data) return NextResponse.json({ error: "Documento nao encontrado." }, { status: 404 });

    const chunks = await admin
      .from("document_chunks")
      .select("content,chunk_index")
      .eq("document_id", id)
      .eq("user_id", auth.user.id)
      .order("chunk_index", { ascending: true })
      .limit(30);
    if (chunks.error) throw chunks.error;
    if (!chunks.data?.length) return NextResponse.json({ error: "Documento ainda nao possui chunks processados." }, { status: 400 });

    const context = chunks.data.map((chunk) => chunk.content).join("\n\n---\n\n");
    const prompt = [
      "Gere um mapa mental de estudos terapeuticos a partir do PDF abaixo.",
      "Retorne JSON valido com: title, central_theme, branches, practical_applications, study_questions, markdown.",
      "branches deve conter title, subtopics e key_points.",
      `Titulo: ${document.data.title}`,
      `Categoria: ${document.data.theme ?? "Sem categoria"}`,
      `Resumo: ${document.data.summary ?? ""}`,
      `Conteudo:\n${context}`,
    ].join("\n\n");

    const result = await answerWithFallback(prompt);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(result.answer.replace(/^```json|```$/g, "").trim()) as Record<string, unknown>;
    } catch {
      parsed = { title: document.data.title, markdown: result.answer, raw: result.answer };
    }

    const payload = {
      user_id: auth.user.id,
      document_id: id,
      title: String(parsed.title ?? `Mapa mental - ${document.data.title}`),
      map_json: parsed,
      markdown: String(parsed.markdown ?? result.answer),
    };
    const legacyPayload = {
      user_id: auth.user.id,
      title: String(parsed.title ?? `Mapa mental - ${document.data.title}`),
      nodes: Array.isArray(parsed.branches)
        ? parsed.branches.map((branch) =>
            typeof branch === "object" && branch !== null && "title" in branch ? String((branch as { title?: unknown }).title ?? "Tema") : String(branch),
          )
        : [String(parsed.central_theme ?? parsed.title ?? document.data.title)],
      edges: [],
      markdown: String(parsed.markdown ?? result.answer),
    };

    let created = await admin
      .from("mind_maps")
      .insert(payload)
      .select("*")
      .single();

    if (created.error && /document_id|map_json/i.test(created.error.message)) {
      const { document_id: _documentId, ...fallbackPayload } = payload;
      created = await admin.from("mind_maps").insert(fallbackPayload).select("*").single();
    }

    if (created.error && /map_json|document_id/i.test(created.error.message)) {
      created = await admin.from("mind_maps").insert(legacyPayload).select("*").single();
    }

    if (created.error) throw created.error;

    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: `mind_map.${result.provider}`, entity_type: "mind_maps", entity_id: created.data.id });
    return NextResponse.json({ mindMap: created.data, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gerar mapa mental." }, { status: 500 });
  }
}
