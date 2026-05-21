import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RagSource } from "@/types/database";
import { estimateTokens } from "@/lib/observability/logger";

export function buildAiCacheKey(userId: string, question: string, sources: RagSource[]) {
  const sourceKey = sources.map((source) => `${source.source_type ?? "document"}:${source.chunk_id}:${source.similarity ?? ""}`).join("|");
  return createHash("sha256").update(`${userId}:${question.trim().toLowerCase()}:${sourceKey}`).digest("hex");
}

export async function getCachedAiAnswer(admin: SupabaseClient, userId: string, cacheKey: string) {
  const { data } = await admin
    .from("ai_response_cache")
    .select("answer,provider,sources")
    .eq("user_id", userId)
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data as { answer: string; provider: string; sources: RagSource[] } | null;
}

export async function storeCachedAiAnswer(admin: SupabaseClient, input: {
  userId: string;
  cacheKey: string;
  provider: string;
  prompt: string;
  answer: string;
  sources: RagSource[];
}) {
  const promptHash = createHash("sha256").update(input.prompt).digest("hex");
  await admin.from("ai_response_cache").upsert({
    user_id: input.userId,
    cache_key: input.cacheKey,
    provider: input.provider,
    prompt_hash: promptHash,
    answer: input.answer,
    sources: input.sources,
    token_estimate: estimateTokens(input.prompt) + estimateTokens(input.answer),
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: "user_id,cache_key" });
}
