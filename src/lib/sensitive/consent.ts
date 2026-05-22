import type { SupabaseClient } from "@supabase/supabase-js";

export type SensitiveFeature =
  | "cycle_tracking"
  | "emotional_journal"
  | "ai_sensitive_adaptation"
  | "push_notifications"
  | "sound_experience";

export const sensitiveConsentVersion = "2026-05-sensitive-v1";

export async function hasSensitiveConsent(admin: SupabaseClient, userId: string, featureName: SensitiveFeature) {
  const { data, error } = await admin
    .from("sensitive_feature_consents")
    .select("consent_given,revoked_at")
    .eq("user_id", userId)
    .eq("feature_name", featureName)
    .eq("consent_version", sensitiveConsentVersion)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.consent_given && !data.revoked_at);
}

export async function requireSensitiveConsent(admin: SupabaseClient, userId: string, featureName: SensitiveFeature) {
  const allowed = await hasSensitiveConsent(admin, userId, featureName);
  if (!allowed) {
    throw new Error("Consentimento explicito obrigatorio para este recurso sensivel.");
  }
}

export function safeSensitiveMetadata(metadata: Record<string, unknown> = {}) {
  return {
    ...metadata,
    content_redacted: true,
    lgpd_sensitive: true,
  };
}
