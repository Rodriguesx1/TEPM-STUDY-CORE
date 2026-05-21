import { generateEmbedding } from "@/lib/ai/providers";
import type { RagSource } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type MatchRow = {
  id: string;
  document_id: string;
  document_title?: string | null;
  document_theme?: string | null;
  user_id: string;
  chunk_index: number;
  content: string;
  similarity: number | null;
};

type VideoMatchRow = {
  id: string;
  video_id: string;
  video_title?: string | null;
  user_id: string;
  chunk_index: number;
  start_seconds: number | null;
  end_seconds: number | null;
  content: string;
  similarity: number | null;
};

type DocumentLookup = {
  id: string;
  title: string;
  summary: string | null;
  theme: string | null;
};

function excerpt(content: string) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 280 ? `${clean.slice(0, 280)}...` : clean;
}

export async function retrieveRelevantContext({
  admin,
  userId,
  question,
  limit = 8,
}: {
  admin: SupabaseClient;
  userId: string;
  question: string;
  limit?: number;
}) {
  const embedding = await generateEmbedding(question);
  let matches: MatchRow[] = [];
  let videoMatches: VideoMatchRow[] = [];

  if (embedding?.length) {
    const semantic = await admin.rpc("match_document_chunks", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: limit,
      min_similarity: 0.25,
    });
    if (!semantic.error && Array.isArray(semantic.data)) {
      matches = semantic.data as MatchRow[];
    }
    const videoSemantic = await admin.rpc("match_video_chunks", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: limit,
      min_similarity: 0.25,
    });
    if (!videoSemantic.error && Array.isArray(videoSemantic.data)) {
      videoMatches = videoSemantic.data as VideoMatchRow[];
    }
  }

  if (!matches.length && !videoMatches.length) {
    const fallback = await admin
      .from("document_chunks")
      .select("id,document_id,user_id,chunk_index,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (fallback.error) throw fallback.error;
    matches = ((fallback.data as Omit<MatchRow, "similarity">[] | null) ?? []).map((row) => ({
      ...row,
      similarity: null,
    }));
    const videoFallback = await admin
      .from("video_chunks")
      .select("id,video_id,user_id,chunk_index,start_seconds,end_seconds,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!videoFallback.error) {
      videoMatches = ((videoFallback.data as Omit<VideoMatchRow, "similarity">[] | null) ?? []).map((row) => ({ ...row, similarity: null }));
    }
  }

  const documentIds = Array.from(new Set(matches.map((match) => match.document_id)));
  const docsResult = documentIds.length
    ? await admin.from("documents").select("id,title,summary,theme").eq("user_id", userId).in("id", documentIds)
    : { data: [], error: null };
  if (docsResult.error) throw docsResult.error;

  const docs = new Map(((docsResult.data as DocumentLookup[] | null) ?? []).map((doc) => [doc.id, doc]));
  const sources: RagSource[] = matches.map((match) => {
    const doc = docs.get(match.document_id);
    return {
      source_type: "document",
      document_id: match.document_id,
      document_title: match.document_title ?? doc?.title ?? "Documento sem titulo",
      chunk_id: match.id,
      chunk_index: match.chunk_index,
      similarity: match.similarity,
      excerpt: excerpt(match.content),
    };
  });
  const videoSources: RagSource[] = videoMatches.map((match) => ({
    source_type: "video",
    document_id: match.video_id,
    document_title: match.video_title ?? "Video sem titulo",
    chunk_id: match.id,
    chunk_index: match.chunk_index,
    similarity: match.similarity,
    excerpt: excerpt(match.content),
    start_seconds: match.start_seconds,
    end_seconds: match.end_seconds,
  }));

  const documentContext = matches
    .map((match, index) => {
      const doc = docs.get(match.document_id);
      return [
        `[Fonte ${index + 1}]`,
        `PDF: ${match.document_title ?? doc?.title ?? "Documento sem titulo"}`,
        `Categoria: ${match.document_theme ?? doc?.theme ?? "Sem categoria"}`,
        `Chunk: ${match.chunk_index}`,
        `Similaridade: ${match.similarity === null ? "fallback" : match.similarity.toFixed(3)}`,
        match.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");
  const videoContext = videoMatches
    .map((match, index) =>
      [
        `[Video Fonte ${index + 1}]`,
        `Video: ${match.video_title ?? "Video sem titulo"}`,
        `Timestamp: ${match.start_seconds ?? "?"}s-${match.end_seconds ?? "?"}s`,
        `Chunk: ${match.chunk_index}`,
        `Similaridade: ${match.similarity === null ? "fallback" : match.similarity.toFixed(3)}`,
        match.content,
      ].join("\n"),
    )
    .join("\n\n---\n\n");
  const context = [documentContext, videoContext].filter(Boolean).join("\n\n---\n\n");

  return {
    context,
    sources: [...sources, ...videoSources],
    usedSemanticSearch: Boolean(embedding?.length && [...matches, ...videoMatches].some((match) => match.similarity !== null)),
  };
}
