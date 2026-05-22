import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Scope = "all_sensitive" | "cycle" | "journal" | "notifications" | "sound_preferences";
const scopes: Scope[] = ["all_sensitive", "cycle", "journal", "notifications", "sound_preferences"];

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const payload = (await request.json()) as { scope?: Scope; reason?: string };
  if (!payload.scope || !scopes.includes(payload.scope)) return NextResponse.json({ error: "Escopo de exclusao invalido." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const requestRow = await admin
    .from("sensitive_data_deletion_requests")
    .insert({ user_id: context.userId, deletion_scope: payload.scope, reason: payload.reason?.slice(0, 500) ?? null, status: "processing", metadata: safeSensitiveMetadata() })
    .select("id")
    .single();
  if (requestRow.error) return NextResponse.json({ error: requestRow.error.message }, { status: 500 });

  const deletes: PromiseLike<unknown>[] = [];
  if (payload.scope === "cycle" || payload.scope === "all_sensitive") {
    deletes.push(admin.from("cycle_predictions").delete().eq("user_id", context.userId));
    deletes.push(admin.from("cycle_entries").delete().eq("user_id", context.userId));
    deletes.push(admin.from("cycle_profiles").delete().eq("user_id", context.userId));
    deletes.push(admin.from("sensitive_feature_consents").update({ consent_given: false, revoked_at: new Date().toISOString() }).eq("user_id", context.userId).eq("feature_name", "cycle_tracking"));
  }
  if (payload.scope === "journal" || payload.scope === "all_sensitive") {
    deletes.push(admin.from("journal_ai_insights").delete().eq("user_id", context.userId));
    deletes.push(admin.from("emotional_journal_entries").delete().eq("user_id", context.userId));
    deletes.push(admin.from("journal_tags").delete().eq("user_id", context.userId));
    deletes.push(admin.from("sensitive_feature_consents").update({ consent_given: false, revoked_at: new Date().toISOString() }).eq("user_id", context.userId).eq("feature_name", "emotional_journal"));
  }
  if (payload.scope === "notifications" || payload.scope === "all_sensitive") {
    deletes.push(admin.from("notifications").delete().eq("user_id", context.userId));
    deletes.push(admin.from("push_subscriptions").delete().eq("user_id", context.userId));
    deletes.push(admin.from("sensitive_feature_consents").update({ consent_given: false, revoked_at: new Date().toISOString() }).eq("user_id", context.userId).eq("feature_name", "push_notifications"));
  }
  if (payload.scope === "sound_preferences" || payload.scope === "all_sensitive") {
    deletes.push(admin.from("notification_preferences").update({ enable_sound: false, sound_volume: 0.25 }).eq("user_id", context.userId));
    deletes.push(admin.from("sensitive_feature_consents").update({ consent_given: false, revoked_at: new Date().toISOString() }).eq("user_id", context.userId).eq("feature_name", "sound_experience"));
  }

  await Promise.all(deletes);
  await admin
    .from("sensitive_data_deletion_requests")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", requestRow.data.id)
    .eq("user_id", context.userId);
  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "sensitive_delete.completed", status: "completed", metadata: safeSensitiveMetadata({ scope: payload.scope }) });

  return NextResponse.json({ ok: true, requestId: requestRow.data.id });
}
