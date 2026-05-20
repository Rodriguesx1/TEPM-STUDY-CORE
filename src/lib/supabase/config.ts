import { getEnv } from "@/lib/utils";

export function getSupabasePublicConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function assertSupabasePublicConfig() {
  const config = getSupabasePublicConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return config as { url: string; anonKey: string };
}

export function assertSupabaseServiceConfig() {
  const publicConfig = assertSupabasePublicConfig();
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    throw new Error("Service role nao configurada no servidor. Defina SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { ...publicConfig, serviceRoleKey };
}
