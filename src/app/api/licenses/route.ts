import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context?.isAdmin) return NextResponse.json({ error: "Admin obrigatorio." }, { status: 403 });

    const { userId, planId, days = 30, status = "active" } = (await request.json()) as {
      userId?: string;
      planId?: string;
      days?: number;
      status?: "active" | "trial" | "blocked";
    };
    if (!userId) return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });

    const admin = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from("licenses")
      .insert({ user_id: userId, plan_id: planId ?? null, status, expires_at: expiresAt, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar licenca." }, { status: 500 });
  }
}
