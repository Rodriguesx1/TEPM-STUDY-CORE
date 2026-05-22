import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { requireSensitiveConsent, safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  await requireSensitiveConsent(admin, context.userId, "push_notifications");

  const payload = (await request.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string }; userAgent?: string };
  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    return NextResponse.json({ error: "Assinatura push invalida." }, { status: 400 });
  }
  const { data, error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        user_id: context.userId,
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        user_agent: payload.userAgent?.slice(0, 300) ?? null,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" },
    )
    .select("id,enabled,created_at,updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "push_subscription.saved", status: "completed", metadata: safeSensitiveMetadata() });
  return NextResponse.json({ subscription: data });
}
