import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function StudyPathsPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("study_paths").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Trilhas de estudo</CardTitle>
          <CardDescription>Planos por modulo, prioridade, dificuldade, revisao e progresso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          {data?.map((path) => (
            <article key={path.id} className="rounded-[16px] border bg-white p-4">
              <h3 className="font-semibold">{path.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{path.description}</p>
            </article>
          ))}
          {!data?.length ? <p className="text-sm text-muted-foreground">Nenhuma trilha criada ainda. A geração automática será liberada após materiais processados.</p> : null}
          <Button disabled={!context.hasPremiumAccess}>Gerar trilha com IA</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
