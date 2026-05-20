import { NextResponse } from "next/server";
import { chunkText, summarizeLocally } from "@/lib/documents/chunking";
import { generateEmbedding } from "@/lib/ai/providers";
import { getServerSupabase } from "@/lib/supabase/server";
import { getEnv } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo PDF obrigatorio." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Somente PDF e aceito nesta rota." }, { status: 400 });

    const maxMb = Number(getEnv("MAX_UPLOAD_MB") ?? "25");
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Arquivo excede o limite de ${maxMb}MB.` }, { status: 413 });
    }

    const userId = auth.user.id;
    const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    const upload = await supabase.storage.from("study-documents").upload(filePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (upload.error) throw upload.error;

    const created = await supabase
      .from("documents")
      .insert({ user_id: userId, title: file.name, file_path: filePath, mime_type: file.type, status: "processing" })
      .select("id")
      .single();
    if (created.error) throw created.error;

    const pdf = await import("pdf-parse");
    const parsed = await pdf.default(Buffer.from(bytes));
    const text = parsed.text ?? "";
    const chunks = chunkText(text);
    const summary = summarizeLocally(text);

    for (const [index, content] of chunks.entries()) {
      const embedding = await generateEmbedding(content);
      await supabase.from("document_chunks").insert({
        user_id: userId,
        document_id: created.data.id,
        chunk_index: index,
        content,
        embedding,
        token_count: Math.ceil(content.length / 4),
      });
    }

    await supabase.from("documents").update({ status: "processed", summary, theme: "PDF terapeutico" }).eq("id", created.data.id);
    await supabase.from("audit_logs").insert({ user_id: userId, action: "document.uploaded", entity_type: "documents", entity_id: created.data.id });

    return NextResponse.json({ message: `PDF processado com ${chunks.length} chunks.`, documentId: created.data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao processar PDF." }, { status: 500 });
  }
}
