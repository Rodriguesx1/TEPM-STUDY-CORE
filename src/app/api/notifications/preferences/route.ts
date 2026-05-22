import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { requireSensitiveConsent, safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const allowedTypes = ["revision", "study", "cycle", "journal", "community", "license", "ai", "progress", "privacy"];

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("notification_preferences").select("*").eq("user_id", context.userId).maybeSingle();
  const notifications = await admin.from("notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(40);
  return NextResponse.json({ preferences: data, notifications: notifications.data ?? [] });
}

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const payload = (await request.json()) as {
    enableInternal?: boolean;
    enablePush?: boolean;
    enableSound?: boolean;
    hideSensitiveOnLockScreen?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    allowedTypes?: string[];
    soundVolume?: number;
  };
  const admin = getSupabaseAdmin();
  if (payload.enablePush) await requireSensitiveConsent(admin, context.userId, "push_notifications");
  if (payload.enableSound) await requireSensitiveConsent(admin, context.userId, "sound_experience");

  const { data, error } = await admin
    .from("notification_preferences")
    .upsert(
      {
        user_id: context.userId,
        enable_internal: payload.enableInternal ?? true,
        enable_push: Boolean(payload.enablePush),
        enable_sound: Boolean(payload.enableSound),
        hide_sensitive_on_lock_screen: payload.hideSensitiveOnLockScreen ?? true,
        quiet_hours_start: payload.quietHoursStart || null,
        quiet_hours_end: payload.quietHoursEnd || null,
        allowed_types: Array.isArray(payload.allowedTypes) ? payload.allowedTypes.filter((item) => allowedTypes.includes(item)) : allowedTypes.filter((item) => !["cycle", "journal"].includes(item)),
        sound_volume: Math.min(1, Math.max(0, Number(payload.soundVolume ?? 0.25))),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "notification_preferences.updated", status: "completed", metadata: safeSensitiveMetadata() });
  return NextResponse.json({ preferences: data });
}
