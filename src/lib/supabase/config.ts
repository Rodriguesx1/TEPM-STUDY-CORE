import { getEnv } from "@/lib/utils";

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
  };
}

export function assertSupabasePublicConfig() {
  const config = getSupabasePublicConfig();
  if (!config.url || !config.anonKey) {
    throw new Error("Ambiente de dados nao configurado. Defina as variaveis publicas de conexao no painel de deploy.");
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
