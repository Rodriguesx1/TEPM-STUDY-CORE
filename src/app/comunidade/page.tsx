import { CommunityPanel } from "@/components/community/community-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePremium } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const context = await requirePremium();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("room_members")
    .select("role,chat_rooms(id,user_id,name,description,access_code,is_locked,created_at)")
    .eq("user_id", context.userId);

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Comunidade interna</CardTitle>
          <CardDescription>Salas privadas por codigo, mensagens e permissao por membro.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          <CommunityPanel initialRooms={(data as any) ?? []} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
