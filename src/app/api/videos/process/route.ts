import { NextResponse } from "next/server";
import { generateEmbedding, parseAiJson, transcribeVideoWithGemini } from "@/lib/ai/providers";
import { chunkText, summarizeLocally } from "@/lib/documents/chunking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

type TranscriptPayload = {
  transcript?: string;
  summary?: string;
  topics?: unknown[];
  segments?: Array<{ start_seconds?: number; end_seconds?: number; title?: string; text?: string }>;
  fixation_questions?: unknown[];
};

export async function POST(request: Request) {
  let videoId: string | null = null;
  let userId: string | null = null;
  let storedFilePath: string | null = null;
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    userId = auth.user.id;

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
        .in("status", ["active", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Plano premium/profissional ativo obrigatorio para processar video." }, { status: 403 });
    }

    const { filePath, title, description, mimeType, size } = (await request.json()) as {
      filePath?: string;
      title?: string;
      description?: string;
      mimeType?: string;
      size?: number;
    };
    if (!filePath || !title || !mimeType) return NextResponse.json({ error: "filePath, title e mimeType sao obrigatorios." }, { status: 400 });
    if (!filePath.startsWith(`${auth.user.id}/`)) return NextResponse.json({ error: "Video nao pertence ao usuario autenticado." }, { status: 403 });
    storedFilePath = filePath;

    const created = await admin
      .from("videos")
      .insert({
        user_id: auth.user.id,
        title,
        description: description ?? null,
        file_path: filePath,
        file_name: title,
        file_size: size ?? null,
        mime_type: mimeType,
        status: "processing",
        transcript_status: "processing",
      })
      .select("id")
      .single();
    if (created.error) throw created.error;
    videoId = created.data.id;

    const download = await admin.storage.from("study-videos").download(filePath);
    if (download.error) throw download.error;
    const bytes = await download.data.arrayBuffer();
    const raw = await transcribeVideoWithGemini(bytes, mimeType);
    const parsed = parseAiJson<TranscriptPayload>(raw, { transcript: "", summary: raw, topics: [], segments: [], fixation_questions: [] });
    const transcript = parsed.transcript?.trim() ?? "";
    if (transcript.length < 40) throw new Error(parsed.summary || "A transcricao nao retornou texto suficiente.");

    const chunks = parsed.segments?.length
      ? parsed.segments.map((segment, index) => ({
          index,
          content: [segment.title, segment.text].filter(Boolean).join("\n").trim(),
          start: segment.start_seconds ?? null,
          end: segment.end_seconds ?? null,
        })).filter((segment) => segment.content)
      : chunkText(transcript).map((content, index) => ({ index, content, start: null, end: null }));

    const summary = parsed.summary || summarizeLocally(transcript);
    const transcriptRow = await admin.from("video_transcripts").insert({
      user_id: auth.user.id,
      video_id: videoId,
      transcript,
      summary,
      topics: parsed.topics ?? [],
      segments: parsed.segments ?? [],
      fixation_questions: parsed.fixation_questions ?? [],
      metadata: { provider: "gemini" },
    });
    if (transcriptRow.error) throw transcriptRow.error;

    for (const segment of chunks) {
      const embedding = await generateEmbedding(segment.content);
      const insert = await admin
        .from("video_chunks")
        .insert({
          user_id: auth.user.id,
          video_id: videoId,
          chunk_index: segment.index,
          start_seconds: segment.start,
          end_seconds: segment.end,
          content: segment.content,
          token_count: Math.ceil(segment.content.length / 4),
          embedding,
          metadata: { source: "video", title },
        })
        .select("id")
        .single();
      if (insert.error) throw insert.error;
      if (embedding?.length) {
        await admin.from("embeddings").insert({
          user_id: auth.user.id,
          source_type: "video_chunk",
          source_id: insert.data.id,
          content: segment.content,
          embedding,
          metadata: { video_id: videoId, chunk_index: segment.index, title },
        });
      }
    }

    await admin
      .from("videos")
      .update({
        status: "processed",
        transcript_status: "transcribed",
        summary,
        topics: parsed.topics ?? [],
        fixation_questions: parsed.fixation_questions ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId)
      .eq("user_id", auth.user.id);
    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: "video.transcribed", entity_type: "videos", entity_id: videoId });

    return NextResponse.json({ message: `Video transcrito com ${chunks.length} trechos.`, videoId });
  } catch (error) {
    if (videoId && userId) {
      const admin = getSupabaseAdmin();
      await admin
        .from("videos")
        .update({ status: "failed", transcript_status: "failed", file_path: null, summary: error instanceof Error ? error.message : "Falha ao transcrever video.", updated_at: new Date().toISOString() })
        .eq("id", videoId)
        .eq("user_id", userId);
      if (storedFilePath) await admin.storage.from("study-videos").remove([storedFilePath]);
      await admin.from("audit_logs").insert({ user_id: userId, action: "video.transcription_failed", entity_type: "videos", entity_id: videoId });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao processar video." }, { status: 500 });
  }
}
