import { AppShell } from "@/components/layout/app-shell";
import { NotificationsPanel } from "@/components/sensitive/notifications-panel";
import { requireUser } from "@/lib/auth/guards";

export default async function NotificationsPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6fae9b]">Orquestracao calma</p>
          <h1 className="mt-2 font-serif text-4xl text-[#f3eee8]">Notificacoes e sons</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#cbbfb1]">
            Configure lembretes internos, permissao push, horario silencioso e sons suaves sempre opt-in.
          </p>
        </div>
        <NotificationsPanel />
      </div>
    </AppShell>
  );
}
