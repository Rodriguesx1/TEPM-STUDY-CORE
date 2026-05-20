import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminPage() {
  const context = await requireAdmin();
  const supabase = await getServerSupabase();
  const [users, licenses, documents, logs] = await Promise.all([
    supabase.from("users_profiles").select("id", { count: "exact", head: true }),
    supabase.from("licenses").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuários" value={String(users.count ?? 0)} detail="Perfis cadastrados" />
          <StatCard label="Licenças" value={String(licenses.count ?? 0)} detail="Planos e convites" />
          <StatCard label="Uploads" value={String(documents.count ?? 0)} detail="Arquivos monitorados" />
          <StatCard label="Logs" value={String(logs.count ?? 0)} detail="Eventos auditáveis" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin Master</CardTitle>
            <CardDescription>
              Gestão central de usuários, licenças, arquivos, salas, memória, uploads, logs, permissões e status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Operações sensíveis devem rodar no servidor com service role e políticas RLS. Este painel não expõe chaves
              administrativas ao navegador.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
