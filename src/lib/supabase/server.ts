import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertSupabasePublicConfig } from "./config";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function getServerSupabase() {
  const cookieStore = await cookies();
  const { url, anonKey } = assertSupabasePublicConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
