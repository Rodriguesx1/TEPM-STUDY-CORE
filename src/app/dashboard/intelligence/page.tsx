import { IntelligencePanel } from "@/components/intelligence/intelligence-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requirePremium } from "@/lib/auth/guards";

export default async function IntelligencePage() {
  const context = await requirePremium();

  return (
    <AppShell context={context}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Ecossistema inteligente</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Memory Core e agentes</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Memoria evolutiva, recomendacoes, revisoes inteligentes, materiais avancados, custo de IA e rastreio de agentes.
          </p>
        </div>
        <IntelligencePanel />
      </div>
    </AppShell>
  );
}
