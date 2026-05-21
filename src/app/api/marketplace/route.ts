import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { ensurePersonalTenant } from "@/lib/ecosystem/tenant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const tenantId = await ensurePersonalTenant(admin, context.userId, context.email);
  const items = await admin
    .from("marketplace_items")
    .select("id,item_type,title,description,visibility,price_cents,downloads_count,status,created_at")
    .or(`user_id.eq.${context.userId},tenant_id.eq.${tenantId},visibility.eq.public_catalog`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (items.error) return NextResponse.json({ error: items.error.message }, { status: 500 });
  return NextResponse.json({ tenantId, items: items.data ?? [] });
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; itemId?: string; itemType?: string; title?: string; description?: string; markdown?: string; visibility?: string };
  const admin = getSupabaseAdmin();
  const tenantId = await ensurePersonalTenant(admin, context.userId, context.email);

  if (body.action === "duplicate" && body.itemId) {
    const item = await admin.from("marketplace_items").select("*").eq("id", body.itemId).maybeSingle();
    if (item.error) return NextResponse.json({ error: item.error.message }, { status: 500 });
    if (!item.data) return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });
    const material = await admin.from("generated_materials").insert({
      user_id: context.userId,
      material_type: item.data.item_type === "slide_deck" ? "apresentacao" : "resumo_premium",
      title: `${item.data.title} (copia)`,
      source_type: "marketplace",
      source_id: item.data.id,
      content: item.data.content,
      markdown: item.data.markdown,
      agent_name: "marketplace",
    }).select("id").single();
    if (material.error) return NextResponse.json({ error: material.error.message }, { status: 500 });
    await admin.from("marketplace_downloads").insert({ user_id: context.userId, item_id: item.data.id, duplicated_material_id: material.data.id });
    await admin.from("marketplace_items").update({ downloads_count: Number(item.data.downloads_count ?? 0) + 1 }).eq("id", item.data.id);
    return NextResponse.json({ materialId: material.data.id });
  }

  const inserted = await admin.from("marketplace_items").insert({
    tenant_id: tenantId,
    user_id: context.userId,
    item_type: body.itemType ?? "template",
    title: body.title?.trim() || "Template premium",
    description: body.description?.trim() || "Modelo privado criado no TEPM Study.",
    markdown: body.markdown ?? "",
    content: { markdown: body.markdown ?? "" },
    visibility: body.visibility ?? "tenant",
  }).select("*").single();
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  return NextResponse.json({ item: inserted.data });
}
