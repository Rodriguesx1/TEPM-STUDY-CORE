import { ReportsPanel } from "@/components/reports/reports-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function ReportsPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Relatorios de evolucao</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Desempenho e lacunas</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Relatorios calculados a partir de PDFs, videos, tarefas, trilhas, pontos, streaks e uso real da Mentora IA.
          </p>
        </div>
        <ReportsPanel />
      </div>
    </AppShell>
  );
}
