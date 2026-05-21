import type { SupabaseClient } from "@supabase/supabase-js";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function ensurePersonalTenant(admin: SupabaseClient, userId: string, email: string | null) {
  const existing = await admin
    .from("tenant_members")
    .select("tenant_id,tenants(id,name,slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing.data?.tenant_id) return existing.data.tenant_id as string;

  const base = email?.split("@")[0] || "tepm";
  const tenant = await admin
    .from("tenants")
    .insert({ owner_user_id: userId, name: "TEPM Study", slug: `${slugify(base)}-${userId.slice(0, 6)}` })
    .select("id")
    .single();
  if (tenant.error) throw tenant.error;

  await admin.from("tenant_members").insert({ tenant_id: tenant.data.id, user_id: userId, role: "owner" });
  await admin.from("tenant_settings").insert({ tenant_id: tenant.data.id, platform_name: "TEPM Study" });
  await admin.from("custom_branding").insert({ tenant_id: tenant.data.id });
  return tenant.data.id as string;
}
