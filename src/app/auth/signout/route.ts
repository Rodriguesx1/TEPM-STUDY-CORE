import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // Missing Supabase env still returns user to login without crashing.
  }
  redirect("/login");
}
