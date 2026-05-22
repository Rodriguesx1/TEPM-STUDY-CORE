import { CyclePanel } from "@/components/sensitive/cycle-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function CyclePage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6fae9b]">Opt-in sensivel</p>
          <h1 className="mt-2 font-serif text-4xl text-[#f3eee8]">Calendario ciclico</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#cbbfb1]">
            Registro opcional para ritmo, energia e estudo. Estimativas nao substituem orientacao medica.
          </p>
        </div>
        <CyclePanel />
      </div>
    </AppShell>
  );
}
