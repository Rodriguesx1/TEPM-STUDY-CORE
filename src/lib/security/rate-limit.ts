import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitInput = {
  admin: SupabaseClient;
  userId?: string | null;
  route: string;
  key: string;
  maxRequests: number;
  windowSeconds: number;
};

export async function checkRateLimit(input: RateLimitInput) {
  const { data, error } = await input.admin
    .rpc("check_rate_limit", {
      limit_key: input.key,
      limit_route: input.route,
      max_requests: input.maxRequests,
      window_seconds: input.windowSeconds,
      limit_user_id: input.userId ?? null,
    })
    .maybeSingle();

  if (error) {
    return { allowed: true, currentCount: 0, resetAt: null, degraded: true };
  }

  const row = data as { allowed?: boolean; current_count?: number; reset_at?: string } | null;
  return {
    allowed: Boolean(row?.allowed),
    currentCount: Number(row?.current_count ?? 0),
    resetAt: row?.reset_at ?? null,
    degraded: false,
  };
}

export function ipKey(request: Request, userId?: string | null) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return userId ? `user:${userId}` : `ip:${ip}`;
}
