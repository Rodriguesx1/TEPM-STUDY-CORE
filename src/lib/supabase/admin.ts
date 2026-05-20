import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseServiceConfig } from "./config";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!adminClient) {
    const { url, serviceRoleKey } = assertSupabaseServiceConfig();
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
