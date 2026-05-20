import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function CommunityPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("room_members")
    .select("chat_rooms(id,name,description,access_code)")
    .eq("user_id", context.userId);

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Comunidade interna</CardTitle>
          <CardDescription>Salas privadas acessíveis apenas por membros autorizados e licença válida.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          {data?.map((row) => {
            const room = Array.isArray(row.chat_rooms) ? row.chat_rooms[0] : row.chat_rooms;
            return room ? (
              <article key={room.id} className="rounded-[16px] border bg-white p-4">
                <h3 className="font-semibold">{room.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{room.description}</p>
              </article>
            ) : null;
          })}
          {!data?.length ? <p className="text-sm text-muted-foreground">Você ainda não participa de salas.</p> : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
