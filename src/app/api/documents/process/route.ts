import { NextResponse } from "next/server";
import { classifyDocumentCategory, generateEmbedding } from "@/lib/ai/providers";
import { chunkText, summarizeLocally } from "@/lib/documents/chunking";
import { logSystemEvent } from "@/lib/observability/logger";
import { checkRateLimit, ipKey } from "@/lib/security/rate-limit";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { getEnv } from "@/lib/utils";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let createdDocumentId: string | null = null;
  let authenticatedUserId: string | null = null;
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    authenticatedUserId = auth.user.id;
    const admin = getSupabaseAdmin();
    const rate = await checkRateLimit({
      admin,
      userId: auth.user.id,
      route: "/api/documents/process",
      key: ipKey(request, auth.user.id),
      maxRequests: 20,
      windowSeconds: 3600,
    });
    if (!rate.allowed) return NextResponse.json({ error: "Limite de processamento por hora atingido." }, { status: 429 });

    const { filePath, title, mimeType, size } = (await request.json()) as {
      filePath?: string;
      title?: string;
      mimeType?: string;
      size?: number;
    };
    if (!filePath || !title) return NextResponse.json({ error: "filePath e title sao obrigatorios." }, { status: 400 });
    if (!filePath.startsWith(`${auth.user.id}/`)) return NextResponse.json({ error: "Arquivo nao pertence ao usuario autenticado." }, { status: 403 });
    if (mimeType && mimeType !== "application/pdf") return NextResponse.json({ error: "Somente PDF e aceito nesta rota." }, { status: 400 });

    const profileResult = await admin.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const { data: profile } = profileResult.data
      ? profileResult
      : await admin.from("users_profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      const { data: license } = await admin
        .from("licenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .in("status", ["active", "trial", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Licenca ativa obrigatoria para processar PDF." }, { status: 403 });
    }

    const maxMb = Number(getEnv("MAX_UPLOAD_MB") ?? "25");
    if (size && size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Arquivo excede o limite de ${maxMb}MB.` }, { status: 413 });
    }

    const created = await admin
      .from("documents")
      .insert({
        user_id: auth.user.id,
        title,
        file_path: filePath,
        file_name: title,
        file_size: size ?? null,
        mime_type: mimeType ?? "application/pdf",
        status: "processing",
        metadata: { original_name: title, storage_bucket: "study-documents" },
      })
      .select("id")
      .single();
    if (created.error) throw created.error;
    createdDocumentId = created.data.id;

    const download = await admin.storage.from("study-documents").download(filePath);
    if (download.error) throw download.error;

    const bytes = await download.data.arrayBuffer();
    const pdf = await import("pdf-parse");
    const parsed = await pdf.default(Buffer.from(bytes));
    const text = (parsed.text ?? "").split(String.fromCharCode(0)).join(" ").trim();
    if (!text || text.length < 40) {
      throw new Error("Nao foi possivel extrair texto suficiente deste PDF. Verifique se o arquivo nao esta corrompido ou composto apenas por imagens.");
    }
    const chunks = chunkText(text);
    if (!chunks.length) throw new Error("O PDF foi lido, mas nao gerou chunks validos.");
    const summary = summarizeLocally(text);
    const category = await classifyDocumentCategory(text);

    for (const [index, content] of chunks.entries()) {
      const embedding = await generateEmbedding(content);
      const insert = await admin
        .from("document_chunks")
        .insert({
          user_id: auth.user.id,
          document_id: created.data.id,
          chunk_index: index,
          content,
          embedding,
          token_count: Math.ceil(content.length / 4),
          metadata: { source: "pdf", title, category },
        })
        .select("id")
        .single();
      if (insert.error) throw insert.error;
      if (embedding?.length) {
        await admin.from("embeddings").insert({
          user_id: auth.user.id,
          source_type: "document_chunk",
          source_id: insert.data.id,
          content,
          embedding,
          metadata: { document_id: created.data.id, chunk_index: index, title, category },
        });
      }
    }

    await admin
      .from("documents")
      .update({ status: "processed", summary, theme: category, themes: [category], updated_at: new Date().toISOString() })
      .eq("id", created.data.id)
      .eq("user_id", auth.user.id);
    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: "document.processed", entity_type: "documents", entity_id: created.data.id });
    await logSystemEvent(admin, {
      userId: auth.user.id,
      event: "document.processed",
      source: "upload",
      route: "/api/documents/process",
      durationMs: Date.now() - startedAt,
      metadata: { document_id: created.data.id, chunks: chunks.length, category, file_size: size ?? null },
    });

    return NextResponse.json({ message: `PDF processado com ${chunks.length} chunks na categoria ${category}.`, documentId: created.data.id, category });
  } catch (error) {
    if (createdDocumentId && authenticatedUserId) {
      const admin = getSupabaseAdmin();
      await admin
        .from("documents")
        .update({
          status: "failed",
          summary: error instanceof Error ? error.message : "Falha ao processar documento.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", createdDocumentId)
        .eq("user_id", authenticatedUserId);
      await admin.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "document.process_failed",
        entity_type: "documents",
        entity_id: createdDocumentId,
      });
      await logSystemEvent(admin, {
        userId: authenticatedUserId,
        level: "error",
        event: "document.process_failed",
        source: "upload",
        route: "/api/documents/process",
        durationMs: Date.now() - startedAt,
        metadata: { document_id: createdDocumentId, message: error instanceof Error ? error.message : "Falha ao processar documento." },
      });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao processar documento." }, { status: 500 });
  }
}
