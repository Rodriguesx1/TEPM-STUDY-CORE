import { AppShell } from "@/components/layout/app-shell";
import { StudyPathGenerator } from "@/components/study/study-path-generator";
import { StudyPathList } from "@/components/study/study-path-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePremium } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function StudyPathsPage() {
  const context = await requirePremium();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("study_paths").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Trilhas de estudo</CardTitle>
          <CardDescription>Planos por modulo, prioridade, dificuldade, revisao e progresso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          <StudyPathGenerator disabled={!context.hasPremiumAccess} />
          <StudyPathList paths={data ?? []} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
