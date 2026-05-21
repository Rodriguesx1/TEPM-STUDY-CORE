import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context?.isAdmin) return NextResponse.json({ error: "Admin obrigatorio." }, { status: 403 });

    const { userId, planId, days = 30, status = "active", expiresAt } = (await request.json()) as {
      userId?: string;
      planId?: string;
      days?: number;
      status?: "active" | "trial" | "expired" | "blocked" | "lifetime";
      expiresAt?: string | null;
    };
    if (!userId) return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });
    if (userId === context.userId) return NextResponse.json({ error: "Super admin nao usa licenca limitada." }, { status: 400 });

    const admin = getSupabaseAdmin();
    const normalizedExpiresAt =
      status === "lifetime" ? null : expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const existing = await admin
      .from("licenses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const query = existing.data
      ? admin
          .from("licenses")
          .update({ plan_id: planId ?? null, status, expires_at: normalizedExpiresAt, created_by: context.userId })
          .eq("id", existing.data.id)
      : admin
          .from("licenses")
          .insert({ user_id: userId, plan_id: planId ?? null, status, expires_at: normalizedExpiresAt, created_by: context.userId });

    const { data, error } = await query
      .select("id, expires_at")
      .single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "license.upsert", entity_type: "licenses", entity_id: data.id, metadata: { target_user_id: userId, status } });
    return NextResponse.json({ id: data.id, expiresAt: data.expires_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar licenca." }, { status: 500 });
  }
}
