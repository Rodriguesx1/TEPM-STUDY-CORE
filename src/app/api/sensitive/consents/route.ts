import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { safeSensitiveMetadata, sensitiveConsentVersion, type SensitiveFeature } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const features: SensitiveFeature[] = ["cycle_tracking", "emotional_journal", "ai_sensitive_adaptation", "push_notifications", "sound_experience"];

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("sensitive_feature_consents")
    .select("feature_name,consent_given,consent_version,granted_at,revoked_at,updated_at")
    .eq("user_id", context.userId)
    .eq("consent_version", sensitiveConsentVersion);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ consents: data ?? [], version: sensitiveConsentVersion });
}

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const payload = (await request.json()) as { featureName?: SensitiveFeature; consentGiven?: boolean };
  if (!payload.featureName || !features.includes(payload.featureName)) {
    return NextResponse.json({ error: "Recurso sensivel invalido." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("sensitive_feature_consents")
    .upsert(
      {
        user_id: context.userId,
        feature_name: payload.featureName,
        consent_given: Boolean(payload.consentGiven),
        consent_version: sensitiveConsentVersion,
        granted_at: payload.consentGiven ? now : null,
        revoked_at: payload.consentGiven ? null : now,
        metadata: safeSensitiveMetadata({ source: "sensitive_consent_center" }),
        updated_at: now,
      },
      { onConflict: "user_id,feature_name,consent_version" },
    )
    .select("feature_name,consent_given,granted_at,revoked_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("privacy_logs").insert({
    user_id: context.userId,
    action: payload.consentGiven ? "sensitive_consent.granted" : "sensitive_consent.revoked",
    status: "completed",
    metadata: safeSensitiveMetadata({ feature_name: payload.featureName }),
  });

  return NextResponse.json({ consent: data });
}
