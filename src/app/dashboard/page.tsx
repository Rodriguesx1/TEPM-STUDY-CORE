import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getLicenseLabel } from "@/lib/licenses/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const [documents, notes, paths, activities] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("study_paths").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("audit_logs").select("id,action,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        {!context.hasPremiumAccess ? (
          <Card className="border-destructive/30 bg-[#fff1f2]">
            <CardHeader>
              <CardTitle>Licenca necessaria</CardTitle>
              <CardDescription>Sua conta existe, mas os recursos premium exigem licenca ativa, vitalicia ou trial valido.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="PDFs enviados" value={String(documents.count ?? 0)} detail="Arquivos processados" />
          <StatCard label="Anotacoes" value={String(notes.count ?? 0)} detail="Caderno terapeutico" />
          <StatCard label="Trilhas" value={String(paths.count ?? 0)} detail="Planos de estudo ativos" />
          <StatCard label="Licenca" value={getLicenseLabel(context.license, context.isAdmin)} detail="Controle real da plataforma" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Proximas acoes</CardTitle>
            <CardDescription>Fluxos reais do MVP. Sem licenca, as operacoes premium retornam bloqueio funcional.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/biblioteca">
              <Button>Enviar PDF</Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary">Conversar com IA</Button>
            </Link>
            <Link href="/caderno">
              <Button variant="outline">Abrir caderno</Button>
            </Link>
            <Link href="/dashboard/videos">
              <Button variant="outline">Enviar video</Button>
            </Link>
            <Link href="/dashboard/slides">
              <Button variant="outline">Gerar slides</Button>
            </Link>
            <Link href="/dashboard/community">
              <Button variant="outline">Comunidade</Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button variant="outline">Calendario</Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline">Relatorios</Button>
            </Link>
            <Link href="/dashboard/intelligence">
              <Button variant="outline">Inteligencia</Button>
            </Link>
            <Link href="/dashboard/productivity">
              <Button variant="outline">Foco</Button>
            </Link>
            <Link href="/dashboard/ecosystem">
              <Button variant="outline">Ecossistema</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ativacao inicial</CardTitle>
            <CardDescription>Checklist de retencao para transformar materiais em rotina de estudo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Enviar primeiro PDF", done: Boolean(documents.count) },
              { label: "Criar uma anotacao", done: Boolean(notes.count) },
              { label: "Gerar trilha", done: Boolean(paths.count) },
              { label: "Abrir calendario", done: false },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border bg-white p-3 text-sm">
                <p className="font-semibold text-[#183c35]">{item.label}</p>
                <p className={item.done ? "text-[#2f7d69]" : "text-muted-foreground"}>{item.done ? "Concluido" : "Pendente"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ultimas atividades</CardTitle>
            <CardDescription>Logs reais de acoes criticas do usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.data?.map((activity) => (
              <div key={activity.id} className="rounded-[14px] border bg-white p-3 text-sm">
                <p className="font-semibold text-[#183c35]">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
            {!activities.data?.length ? <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

