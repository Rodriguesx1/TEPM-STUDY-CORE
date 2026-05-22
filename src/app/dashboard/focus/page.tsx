import { FocusWorkspace } from "@/components/sensitive/focus-workspace";
import { requireUser } from "@/lib/auth/guards";

export default async function FocusPage() {
  await requireUser();

  return (
    <main className="min-h-dvh bg-[#071412] p-4 text-[#f3eee8] sm:p-8">
      <FocusWorkspace />
    </main>
  );
}
