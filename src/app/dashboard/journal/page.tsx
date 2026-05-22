import { AppShell } from "@/components/layout/app-shell";
import { JournalPanel } from "@/components/sensitive/journal-panel";
import { requireUser } from "@/lib/auth/guards";

export default async function JournalPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6fae9b]">Privado por padrao</p>
          <h1 className="mt-2 font-serif text-4xl text-[#f3eee8]">Diario emocional</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#cbbfb1]">
            Registre reflexoes e escolha explicitamente se uma entrada pode ou nao alimentar a IA.
          </p>
        </div>
        <JournalPanel />
      </div>
    </AppShell>
  );
}
