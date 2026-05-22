import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const admin = getSupabaseAdmin();
  const [consents, cycleProfile, cycleEntries, cyclePredictions, journalEntries, journalInsights, notifications, preferences] = await Promise.all([
    admin.from("sensitive_feature_consents").select("feature_name,consent_given,consent_version,granted_at,revoked_at,created_at,updated_at").eq("user_id", context.userId),
    admin.from("cycle_profiles").select("*").eq("user_id", context.userId).maybeSingle(),
    admin.from("cycle_entries").select("*").eq("user_id", context.userId).order("entry_date", { ascending: false }),
    admin.from("cycle_predictions").select("*").eq("user_id", context.userId).order("predicted_date", { ascending: true }),
    admin.from("emotional_journal_entries").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
    admin.from("journal_ai_insights").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
    admin.from("notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
    admin.from("notification_preferences").select("*").eq("user_id", context.userId).maybeSingle(),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    sensitive_consents: consents.data ?? [],
    cycle_profile: cycleProfile.data ?? null,
    cycle_entries: cycleEntries.data ?? [],
    cycle_predictions: cyclePredictions.data ?? [],
    emotional_journal_entries: journalEntries.data ?? [],
    journal_ai_insights: journalInsights.data ?? [],
    notifications: notifications.data ?? [],
    notification_preferences: preferences.data ?? null,
  };

  await admin.from("privacy_exports").insert({ user_id: context.userId, export_scope: "sensitive", metadata: safeSensitiveMetadata({ sections: Object.keys(exportData) }) });
  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "sensitive_export.generated", status: "completed", metadata: safeSensitiveMetadata() });

  return NextResponse.json(exportData);
}
