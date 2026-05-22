"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuxuryBadge, PremiumCard } from "@/components/ui/premium";

type Adaptation = {
  sensitiveContextUsed: boolean;
  cyclePhase: string | null;
  energyLevel: number | null;
  intensity: string;
  nextAction: string;
  message: string;
  medicalBoundary: string;
};

export function AdaptationCard() {
  const [data, setData] = useState<Adaptation | null>(null);

  useEffect(() => {
    fetch("/api/study/adaptation", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setData(payload))
      .catch(() => setData(null));
  }, []);

  return (
    <PremiumCard>
      <LuxuryBadge>Presenca inteligente</LuxuryBadge>
      <div className="mt-4 flex items-start gap-4">
        <Brain className="mt-1 h-6 w-6 shrink-0 text-[#6fae9b]" />
        <div>
          <h2 className="font-serif text-3xl text-[#f3eee8]">{data?.intensity ? `Ritmo ${data.intensity}` : "Ritmo acolhedor"}</h2>
          <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{data?.message ?? "Carregando recomendacao do dia..."}</p>
          {data?.cyclePhase ? <p className="mt-2 text-xs text-[#b79a6b]">Contexto opt-in: fase {data.cyclePhase}, energia {data.energyLevel ?? "-"}</p> : null}
          <p className="mt-3 text-sm font-semibold text-[#f2eadf]">{data?.nextAction}</p>
          <p className="mt-3 text-xs leading-6 text-[#cbbfb1]">{data?.medicalBoundary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/focus"><Button size="sm">Modo foco</Button></Link>
            <Link href="/dashboard/calm"><Button size="sm" variant="outline">Modo acolhimento</Button></Link>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
