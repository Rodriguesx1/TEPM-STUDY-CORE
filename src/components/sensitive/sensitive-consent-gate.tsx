"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumCard, SoftPanel } from "@/components/ui/premium";

type Consent = {
  feature_name: string;
  consent_given: boolean;
  revoked_at: string | null;
};

const copy: Record<string, { title: string; body: string }> = {
  cycle_tracking: {
    title: "Ativar calendario ciclico opcional",
    body: "Este recurso pode registrar ciclo, humor, energia, sintomas e notas privadas. As previsoes sao estimativas e nao substituem orientacao medica.",
  },
  emotional_journal: {
    title: "Ativar diario emocional privado",
    body: "Este recurso salva reflexoes, humor, energia, sonhos, tags e texto livre. Admin nao deve acessar esse conteudo por padrao.",
  },
  ai_sensitive_adaptation: {
    title: "Permitir IA adaptativa com dados sensiveis",
    body: "A IA so usara ciclo ou diario quando voce permitir. Voce pode registrar textos sem usa-los na IA.",
  },
  push_notifications: {
    title: "Ativar notificacoes push",
    body: "O navegador pedira permissao. Notificacoes sensiveis podem ser ocultadas por preferencia.",
  },
  sound_experience: {
    title: "Ativar sons suaves",
    body: "Sons terapeuticos ficam desligados por padrao, volume baixo e podem ser revogados a qualquer momento.",
  },
};

export function SensitiveConsentGate({ featureName, children }: { featureName: keyof typeof copy; children: React.ReactNode }) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const feature = copy[featureName];
  const active = useMemo(() => consents.some((item) => item.feature_name === featureName && item.consent_given && !item.revoked_at), [consents, featureName]);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/sensitive/consents", { cache: "no-store" });
    const payload = (await response.json()) as { consents?: Consent[]; error?: string };
    if (!response.ok) setMessage(payload.error ?? "Nao foi possivel verificar consentimentos.");
    setConsents(payload.consents ?? []);
    setLoading(false);
  }

  async function save(consentGiven: boolean) {
    setMessage(null);
    const response = await fetch("/api/sensitive/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureName, consentGiven }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel salvar consentimento.");
      return;
    }
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <PremiumCard><p className="text-sm text-[#cbbfb1]">Verificando consentimento...</p></PremiumCard>;
  }

  if (!active) {
    return (
      <PremiumCard>
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#6fae9b]" />
          <div>
            <h2 className="font-serif text-3xl text-[#f3eee8]">{feature.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#cbbfb1]">{feature.body}</p>
            <SoftPanel className="mt-4 text-sm leading-7 text-[#f2eadf]">
              Opt-in LGPD: voce pode nao usar, revogar depois, exportar ou excluir estes dados. O recurso fica bloqueado enquanto o consentimento nao estiver ativo.
            </SoftPanel>
            {message ? <p className="mt-4 rounded-[14px] bg-[#2a1117] p-3 text-sm text-[#ffd7dc]">{message}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => save(true)}>Aceitar e ativar</Button>
              <Button type="button" variant="outline" onClick={() => save(false)}>Nao usar agora</Button>
            </div>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return <>{children}</>;
}
