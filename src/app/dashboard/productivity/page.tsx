import { ProductivityPanel } from "@/components/productivity/productivity-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requirePremium } from "@/lib/auth/guards";

export default async function ProductivityPage() {
  const context = await requirePremium();

  return (
    <AppShell context={context}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Produtividade absoluta</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Foco, revisao e modo escuta</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Base funcional para sessoes pomodoro, leitura guiada, futuras vozes e avatarizacao sem criar avatar falso.
          </p>
        </div>
        <ProductivityPanel />
      </div>
    </AppShell>
  );
}
