import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LuxuryBadge, PremiumCard, SoftPanel } from "@/components/ui/premium";
import { requireUser } from "@/lib/auth/guards";

export default async function CalmPage() {
  const context = await requireUser();

  return (
    <AppShell context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <PremiumCard>
          <LuxuryBadge>Modo acolhimento</LuxuryBadge>
          <h1 className="mt-5 font-serif text-5xl text-[#f3eee8]">Chegue com calma.</h1>
          <p className="mt-4 text-sm leading-8 text-[#cbbfb1]">
            Este espaco reduz estimulos e sugere uma retomada leve. Nao faz diagnostico emocional ou medico.
          </p>
        </PremiumCard>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Respirar", "Inspire por 4 tempos, solte por 6. Repita tres vezes."],
            ["Nomear", "Observe uma palavra para seu estado atual, sem julgamento."],
            ["Escolher", "Pegue uma acao pequena: diario, revisao curta ou pausa."],
          ].map(([title, body]) => (
            <SoftPanel key={title}>
              <h2 className="font-serif text-2xl text-[#f3eee8]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">{body}</p>
            </SoftPanel>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/journal"><Button>Registrar diario</Button></Link>
          <Link href="/trilhas"><Button variant="outline">Revisao leve</Button></Link>
          <Link href="/dashboard"><Button variant="ghost">Voltar ao centro</Button></Link>
        </div>
      </div>
    </AppShell>
  );
}
