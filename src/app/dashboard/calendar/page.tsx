import { StudyCalendarPanel } from "@/components/calendar/study-calendar-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function CalendarPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7d69]">Evolucao guiada</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#14352f]">Calendario terapeutico</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Organize tarefas, revisoes, metas semanais e sessoes simuladas com pontuacao real e historico auditavel.
          </p>
        </div>
        <StudyCalendarPanel />
      </div>
    </AppShell>
  );
}
