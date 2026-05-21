import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { logSystemEvent } from "@/lib/observability/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const admin = getSupabaseAdmin();
  const [profile, licenses, documents, videos, notes, tasks, consents, deletionRequests] = await Promise.all([
    admin.from("profiles").select("id,email,full_name,role,created_at").eq("id", context.userId).maybeSingle(),
    admin.from("licenses").select("status,starts_at,expires_at,created_at").eq("user_id", context.userId),
    admin.from("documents").select("id,title,status,summary,theme,created_at").eq("user_id", context.userId),
    admin.from("videos").select("id,title,status,summary,created_at").eq("user_id", context.userId),
    admin.from("notes").select("id,title,content,tags,created_at,updated_at").eq("user_id", context.userId),
    admin.from("study_tasks").select("id,title,task_type,status,due_at,completed_at,points_awarded").eq("user_id", context.userId),
    admin.from("user_consents").select("consent_type,status,version,created_at").eq("user_id", context.userId),
    admin.from("deletion_requests").select("id,status,requested_at,scheduled_for,processed_at").eq("user_id", context.userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    licenses: licenses.data ?? [],
    documents: documents.data ?? [],
    videos: videos.data ?? [],
    notes: notes.data ?? [],
    study_tasks: tasks.data ?? [],
    consents: consents.data ?? [],
    deletion_requests: deletionRequests.data ?? [],
  };

  await admin.from("privacy_logs").insert({ user_id: context.userId, action: "data_export.generated", status: "completed", metadata: { sections: Object.keys(exportData) } });
  await logSystemEvent(admin, { userId: context.userId, event: "privacy.export.generated", source: "lgpd", route: "/api/privacy" });
  return NextResponse.json(exportData);
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

  const payload = (await request.json()) as { action?: string; consentType?: string; status?: string; reason?: string };
  const admin = getSupabaseAdmin();

  if (payload.action === "consent") {
    const consentType = payload.consentType;
    if (!consentType || !["terms", "privacy", "upload_processing", "ai_processing", "marketing"].includes(consentType)) {
      return NextResponse.json({ error: "Tipo de consentimento invalido." }, { status: 400 });
    }
    const status = payload.status === "revoked" ? "revoked" : "accepted";
    const { data, error } = await admin
      .from("user_consents")
      .upsert(
        { user_id: context.userId, consent_type: consentType, status, version: "2026-05", metadata: { source: "privacy_center" } },
        { onConflict: "user_id,consent_type,version" },
      )
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("privacy_logs").insert({ user_id: context.userId, action: `consent.${status}`, status: "completed", metadata: { consent_type: consentType } });
    return NextResponse.json({ consent: data });
  }

  if (payload.action === "delete_request") {
    const existing = await admin
      .from("deletion_requests")
      .select("id,status")
      .eq("user_id", context.userId)
      .in("status", ["requested", "approved", "processing"])
      .maybeSingle();
    if (existing.data) return NextResponse.json({ request: existing.data, message: "Ja existe uma solicitacao de exclusao em andamento." });

    const { data, error } = await admin
      .from("deletion_requests")
      .insert({ user_id: context.userId, reason: payload.reason?.slice(0, 500) ?? null, metadata: { source: "privacy_center" } })
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("privacy_logs").insert({ user_id: context.userId, action: "deletion.requested", status: "requested", metadata: { deletion_request_id: data.id } });
    await logSystemEvent(admin, { userId: context.userId, level: "warn", event: "privacy.deletion_requested", source: "lgpd", route: "/api/privacy" });
    return NextResponse.json({ request: data });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}
