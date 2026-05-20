import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function NotesPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("notes").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Caderno terapêutico</CardTitle>
          <CardDescription>Textos, insights, scripts, observações e reflexões persistidos por usuário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          {data?.map((note) => (
            <article key={note.id} className="rounded-[16px] border bg-white p-4">
              <h3 className="font-semibold">{note.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p>
            </article>
          ))}
          {!data?.length ? <p className="text-sm text-muted-foreground">Nenhuma anotação salva ainda.</p> : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
