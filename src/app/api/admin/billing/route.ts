import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

export async function GET() {
  try {
    const context = await getSessionContext();
    if (!context?.isAdmin) return NextResponse.json({ error: "Admin obrigatorio." }, { status: 403 });

    const admin = getSupabaseAdmin();
    const [plans, coupons, history, subscriptions, profiles, licenses] = await Promise.all([
      admin.from("billing_plans").select("*").order("sort_order", { ascending: true }),
      admin.from("coupons").select("*").order("created_at", { ascending: false }),
      admin.from("license_history").select("*").order("created_at", { ascending: false }).limit(50),
      admin.from("subscription_events").select("*").order("created_at", { ascending: false }).limit(50),
      admin.from("profiles").select("id,email,full_name,role").order("email", { ascending: true }),
      admin.from("licenses").select("id,user_id,plan_id,status,expires_at,created_at").order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      plans: plans.data ?? [],
      coupons: coupons.data ?? [],
      history: history.data ?? [],
      subscriptionEvents: subscriptions.data ?? [],
      profiles: profiles.data ?? [],
      licenses: licenses.data ?? [],
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar financeiro." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context?.isAdmin) return NextResponse.json({ error: "Admin obrigatorio." }, { status: 403 });

    const payload = (await request.json()) as Record<string, unknown>;
    const action = text(payload.action);
    const admin = getSupabaseAdmin();

  if (action === "plan") {
    const name = text(payload.name);
    const slug = text(payload.slug).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!name || !slug) return NextResponse.json({ error: "Nome e slug do plano sao obrigatorios." }, { status: 400 });
    const { data, error } = await admin
      .from("billing_plans")
      .upsert(
        {
          name,
          slug,
          description: text(payload.description),
          price_cents: Math.max(0, Number(payload.priceCents) || 0),
          interval: ["free", "month", "year", "lifetime"].includes(text(payload.interval)) ? text(payload.interval) : "month",
          features: Array.isArray(payload.features) ? payload.features : String(payload.features ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
          limits: typeof payload.limits === "object" && payload.limits ? payload.limits : {},
          is_active: payload.isActive !== false,
          sort_order: Number(payload.sortOrder) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "billing_plan.upsert", entity_type: "billing_plans", entity_id: data.id });
    return NextResponse.json({ plan: data });
  }

  if (action === "coupon") {
    const code = text(payload.code).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!code) return NextResponse.json({ error: "Codigo do cupom obrigatorio." }, { status: 400 });
    const { data, error } = await admin
      .from("coupons")
      .insert({
        code,
        description: text(payload.description),
        discount_percent: Math.min(100, Math.max(0, Number(payload.discountPercent) || 0)),
        bonus_days: Math.max(0, Number(payload.bonusDays) || 0),
        expires_at: typeof payload.expiresAt === "string" && payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
        max_redemptions: Number(payload.maxRedemptions) || null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "coupon.created", entity_type: "coupons", entity_id: data.id });
    return NextResponse.json({ coupon: data });
  }

  if (action === "license") {
    const userId = text(payload.userId);
    if (!userId) return NextResponse.json({ error: "Usuario obrigatorio." }, { status: 400 });
    if (userId === context.userId) return NextResponse.json({ error: "Super admin permanece ilimitado por role." }, { status: 400 });

    const existing = await admin.from("licenses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing.error) throw existing.error;

    const status = ["active", "trial", "expired", "blocked", "lifetime"].includes(text(payload.status)) ? text(payload.status) : "active";
    const expiresAt = status === "lifetime" ? null : typeof payload.expiresAt === "string" && payload.expiresAt ? new Date(payload.expiresAt).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

    const write = existing.data
      ? admin.from("licenses").update({ status, expires_at: expiresAt, plan_id: text(payload.planId) || null, created_by: context.userId }).eq("id", existing.data.id)
      : admin.from("licenses").insert({ user_id: userId, status, expires_at: expiresAt, plan_id: text(payload.planId) || null, created_by: context.userId });

    const { data, error } = await write.select("*").single();
    if (error) throw error;
    await admin.from("license_history").insert({
      user_id: userId,
      license_id: data.id,
      changed_by: context.userId,
      action: existing.data ? "manual_change" : "manual_create",
      from_status: existing.data?.status ?? null,
      to_status: status,
      from_expires_at: existing.data?.expires_at ?? null,
      to_expires_at: expiresAt,
      metadata: { source: "admin_billing" },
    });
    await admin.from("subscription_events").insert({ user_id: userId, license_id: data.id, event_type: `license.${status}`, metadata: { changed_by: context.userId } });
    return NextResponse.json({ license: data });
  }

  if (action === "expire_now") {
    const { data, error } = await admin
      .from("licenses")
      .update({ status: "expired" })
      .in("status", ["active", "trial"])
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString())
      .select("id");
    if (error) throw error;
      return NextResponse.json({ expired: data?.length ?? 0 });
    }

    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao salvar financeiro." }, { status: 500 });
  }
}
