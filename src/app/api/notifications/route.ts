import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { ensurePersonalTenant } from "@/lib/ecosystem/tenant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const notifications = await admin.from("smart_notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30);
  if (notifications.error) return NextResponse.json({ error: notifications.error.message }, { status: 500 });
  return NextResponse.json({ notifications: notifications.data ?? [] });
}

export async function POST() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const tenantId = await ensurePersonalTenant(admin, context.userId, context.email);
  const payload = [
    { notification_type: "study_reminder", title: "Estudo do dia", body: "Revise um material processado e registre uma sessao de foco.", action_url: "/dashboard/productivity" },
    { notification_type: "revision_reminder", title: "Revisao inteligente", body: "Sua fila cognitiva pode ter materiais para revisar.", action_url: "/dashboard/intelligence" },
    { notification_type: "progress_alert", title: "Progresso semanal", body: "Veja lacunas, custos e agentes usados no painel de inteligencia.", action_url: "/dashboard/intelligence" },
  ].map((item) => ({ ...item, tenant_id: tenantId, user_id: context.userId }));
  const inserted = await admin.from("smart_notifications").insert(payload).select("*");
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  return NextResponse.json({ notifications: inserted.data ?? [] });
}
