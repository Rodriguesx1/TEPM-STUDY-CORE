import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const [documents, notes, paths, rooms] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("study_paths").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("room_members").select("room_id", { count: "exact", head: true }).eq("user_id", context.userId),
  ]);

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        {!context.hasPremiumAccess ? (
          <Card className="border-destructive/30 bg-[#fff1f2]">
            <CardHeader>
              <CardTitle>Licença necessária</CardTitle>
              <CardDescription>Sua conta existe, mas os recursos premium exigem licença ativa ou trial válido.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Documentos" value={String(documents.count ?? 0)} detail="PDFs e textos processados" />
          <StatCard label="Anotações" value={String(notes.count ?? 0)} detail="Caderno terapêutico" />
          <StatCard label="Trilhas" value={String(paths.count ?? 0)} detail="Planos de estudo ativos" />
          <StatCard label="Salas" value={String(rooms.count ?? 0)} detail="Comunidades privadas" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Próximas ações</CardTitle>
            <CardDescription>Fluxos reais do MVP. Sem licença, as operações premium retornam bloqueio funcional.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/biblioteca"><Button>Enviar PDF</Button></Link>
            <Link href="/chat"><Button variant="secondary">Conversar com IA</Button></Link>
            <Link href="/caderno"><Button variant="outline">Abrir caderno</Button></Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
