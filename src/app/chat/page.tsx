import { ChatPanel } from "@/components/library/chat-panel";
import { AppShell } from "@/components/layout/app-shell";
import { requirePremium } from "@/lib/auth/guards";

export default async function ChatPage() {
  const context = await requirePremium();
  return (
    <AppShell context={context}>
      <ChatPanel />
    </AppShell>
  );
}
