import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { ensurePersonalTenant } from "@/lib/ecosystem/tenant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const tenantId = await ensurePersonalTenant(admin, context.userId, context.email);
  const [sessions, comments, documents] = await Promise.all([
    admin.from("collaborative_sessions").select("*").or(`owner_user_id.eq.${context.userId},tenant_id.eq.${tenantId}`).order("created_at", { ascending: false }).limit(20),
    admin.from("document_comments").select("id,document_id,body,created_at,documents(title)").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
    admin.from("documents").select("id,title,theme").eq("user_id", context.userId).eq("status", "processed").order("created_at", { ascending: false }).limit(20),
  ]);
  if (sessions.error) return NextResponse.json({ error: sessions.error.message }, { status: 500 });
  return NextResponse.json({ tenantId, sessions: sessions.data ?? [], comments: comments.data ?? [], documents: documents.data ?? [] });
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; documentId?: string; title?: string; body?: string };
  const admin = getSupabaseAdmin();
  const tenantId = await ensurePersonalTenant(admin, context.userId, context.email);

  if (body.action === "comment") {
    if (!body.documentId || !body.body?.trim()) return NextResponse.json({ error: "Documento e comentario obrigatorios." }, { status: 400 });
    const inserted = await admin.from("document_comments").insert({ tenant_id: tenantId, document_id: body.documentId, user_id: context.userId, body: body.body }).select("*").single();
    if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
    return NextResponse.json({ comment: inserted.data });
  }

  const session = await admin.from("collaborative_sessions").insert({
    tenant_id: tenantId,
    owner_user_id: context.userId,
    title: body.title?.trim() || "Revisao colaborativa",
    source_type: "document",
    source_id: body.documentId || null,
    metadata: { mode: "controlled_sharing" },
  }).select("*").single();
  if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });
  return NextResponse.json({ session: session.data });
}
