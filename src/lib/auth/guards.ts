import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import type { License, Profile } from "@/types/database";

export type SessionContext = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  license: License | null;
  isAdmin: boolean;
  hasPremiumAccess: boolean;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  try {
    const supabase = await getServerSupabase();
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) return null;

    const userId = userResult.user.id;
    const [{ data: profile }, { data: license }] = await Promise.all([
      supabase.from("users_profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("licenses")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trial"])
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const isAdmin = profile?.role === "admin";
    return {
      userId,
      email: userResult.user.email ?? null,
      profile: (profile as Profile | null) ?? null,
      license: (license as License | null) ?? null,
      isAdmin,
      hasPremiumAccess: isAdmin || Boolean(license),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const context = await getSessionContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireAdmin() {
  const context = await requireUser();
  if (!context.isAdmin) redirect("/dashboard");
  return context;
}
