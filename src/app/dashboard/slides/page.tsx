import { AppShell } from "@/components/layout/app-shell";
import { SlidesPanel } from "@/components/slides/slides-panel";
import { requirePremium } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SlidePage, SlideProject } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SlidesPage() {
  const context = await requirePremium();
  const admin = getSupabaseAdmin();
  const [projectsResult, pagesResult] = await Promise.all([
    admin.from("slide_projects").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }),
    admin.from("slide_pages").select("*").eq("user_id", context.userId).order("page_index", { ascending: true }),
  ]);

  return (
    <AppShell context={context}>
      <SlidesPanel projects={(projectsResult.data as SlideProject[] | null) ?? []} pages={(pagesResult.data as SlidePage[] | null) ?? []} />
    </AppShell>
  );
}
