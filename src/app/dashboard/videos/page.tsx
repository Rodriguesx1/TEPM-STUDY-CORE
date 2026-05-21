import { AppShell } from "@/components/layout/app-shell";
import { VideoList } from "@/components/video/video-list";
import { VideoUploadPanel } from "@/components/video/video-upload-panel";
import { requirePremium } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { VideoRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const context = await requirePremium();
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("videos").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
  const videos = (data as VideoRecord[] | null) ?? [];

  return (
    <AppShell context={context}>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <VideoUploadPanel />
        <VideoList videos={videos} />
      </div>
    </AppShell>
  );
}
