import { LicenseManager } from "@/components/admin/license-manager";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminPage() {
  const context = await requireAdmin();
  const supabase = await getServerSupabase();
  const [licenses, documents, logs] = await Promise.all([
    supabase.from("licenses").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);
  const profileRows = await supabase.from("profiles").select("id,email,full_name,role").order("email", { ascending: true });
  const legacyProfileRows = profileRows.error
    ? await supabase.from("users_profiles").select("id,email,full_name,role").order("email", { ascending: true })
    : null;
  const profiles = profileRows.data ?? legacyProfileRows?.data ?? [];
  const { data: licenseRows } = await supabase.from("licenses").select("id,user_id,status,expires_at").order("created_at", { ascending: false });

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuarios" value={String(profiles.length)} detail="Perfis cadastrados" />
          <StatCard label="Licencas" value={String(licenses.count ?? 0)} detail="Planos e convites" />
          <StatCard label="Uploads" value={String(documents.count ?? 0)} detail="Arquivos monitorados" />
          <StatCard label="Logs" value={String(logs.count ?? 0)} detail="Eventos auditaveis" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin Master</CardTitle>
            <CardDescription>Gestao central de usuarios, licencas, arquivos, salas, memoria, uploads, logs, permissoes e status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Operacoes sensiveis rodam no servidor com service role e politicas RLS. Este painel nao expoe chaves administrativas ao navegador.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Licencas</CardTitle>
            <CardDescription>Crie ou atualize licencas reais. Admin permanece ilimitado por role, sem licenca.</CardDescription>
          </CardHeader>
          <CardContent>
            <LicenseManager profiles={profiles} licenses={licenseRows ?? []} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
