import { EcosystemPanel } from "@/components/ecosystem/ecosystem-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requirePremium } from "@/lib/auth/guards";

export default async function EcosystemPage() {
  const context = await requirePremium();

  return (
    <AppShell context={context}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Ecossistema enterprise</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Mobile, realtime, marketplace e colaboração</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Fundação PWA/mobile, IA em tempo real, marketplace privado, colaboração controlada, notificações e offline sync.
          </p>
        </div>
        <EcosystemPanel />
      </div>
    </AppShell>
  );
}
