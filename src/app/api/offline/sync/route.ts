import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const rows = await admin.from("offline_sync_queue").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
  if (rows.error) return NextResponse.json({ error: rows.error.message }, { status: 500 });
  return NextResponse.json({ queue: rows.data ?? [] });
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { clientId?: string; operations?: Array<{ operation: string; payload: Record<string, unknown> }> };
  const operations = Array.isArray(body.operations) ? body.operations : [];
  if (!operations.length) return NextResponse.json({ error: "Nenhuma operacao offline enviada." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const rows = operations.map((item) => ({
    user_id: context.userId,
    client_id: body.clientId ?? "web",
    operation: item.operation,
    payload: item.payload ?? {},
    status: "pending",
  }));
  const inserted = await admin.from("offline_sync_queue").insert(rows).select("*");
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  return NextResponse.json({ queued: inserted.data ?? [] });
}
