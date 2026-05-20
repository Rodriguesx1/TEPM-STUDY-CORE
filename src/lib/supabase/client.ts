"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabasePublicConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!browserClient) {
    const { url, anonKey } = assertSupabasePublicConfig();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
