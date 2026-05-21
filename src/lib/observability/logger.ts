import type { SupabaseClient } from "@supabase/supabase-js";

type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

type LogInput = {
  userId?: string | null;
  level?: LogLevel;
  event: string;
  source?: string;
  route?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export async function logSystemEvent(admin: SupabaseClient, input: LogInput) {
  try {
    await admin.from("system_logs").insert({
      user_id: input.userId ?? null,
      level: input.level ?? "info",
      event: input.event,
      source: input.source ?? "app",
      route: input.route ?? null,
      duration_ms: input.durationMs ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Logging must never break the primary user flow.
  }
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}
