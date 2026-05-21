import { BillingPanel } from "@/components/admin/billing-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminBillingPage() {
  const context = await requireAdmin();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Financeiro e licencas</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Billing administrativo</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Planos, cupons, upgrades, downgrades, vencimentos e historico de alteracoes com validacao no servidor.
          </p>
        </div>
        <BillingPanel />
      </div>
    </AppShell>
  );
}
