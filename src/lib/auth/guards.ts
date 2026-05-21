import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { isLicenseActive } from "@/lib/licenses/guards";
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
    const profileResult = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const profile =
      profileResult.data ??
      (await supabase.from("users_profiles").select("*").eq("id", userId).maybeSingle()).data ??
      null;

    const { data: license } = await
      supabase
        .from("licenses")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trial", "lifetime"])
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const isAdmin = profile?.role === "admin";
    return {
      userId,
      email: userResult.user.email ?? null,
      profile: (profile as Profile | null) ?? null,
      license: (license as License | null) ?? null,
      isAdmin,
      hasPremiumAccess: isAdmin || isLicenseActive((license as License | null) ?? null),
    };
  } catch {
    return null;
  }
}

export async function requirePremium() {
  const context = await requireUser();
  if (!context.hasPremiumAccess) redirect("/bloqueado");
  return context;
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
