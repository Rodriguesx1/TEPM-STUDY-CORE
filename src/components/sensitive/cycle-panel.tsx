"use client";

import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { SensitiveConsentGate } from "@/components/sensitive/sensitive-consent-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LuxuryBadge, PremiumCard, SoftPanel } from "@/components/ui/premium";

type CyclePayload = {
  profile: { last_period_start: string | null; average_cycle_length: number; average_period_length: number } | null;
  entries: Array<{ id: string; entry_date: string; phase: string; mood: string | null; energy_level: number | null; symptoms: string[]; private_notes: string | null }>;
  predictions: Array<{ id: string; predicted_date: string; predicted_phase: string; disclaimer: string }>;
};

export function CyclePanel() {
  const [data, setData] = useState<CyclePayload>({ profile: null, entries: [], predictions: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [averagePeriodLength, setAveragePeriodLength] = useState(5);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [symptoms, setSymptoms] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [useForAi, setUseForAi] = useState(false);

  async function load() {
    const response = await fetch("/api/cycle", { cache: "no-store" });
    const payload = (await response.json()) as CyclePayload & { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel carregar ciclo.");
      return;
    }
    setData(payload);
    if (payload.profile) {
      setLastPeriodStart(payload.profile.last_period_start ?? "");
      setAverageCycleLength(payload.profile.average_cycle_length);
      setAveragePeriodLength(payload.profile.average_period_length);
    }
  }

  async function post(body: Record<string, unknown>, success: string) {
    setMessage(null);
    const response = await fetch("/api/cycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao salvar.");
      return;
    }
    setMessage(success);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SensitiveConsentGate featureName="cycle_tracking">
      <div className="space-y-6">
        {message ? <p className="rounded-[16px] border border-[#6fae9b]/20 bg-[#0d2b26] p-3 text-sm text-[#f2eadf]">{message}</p> : null}
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <PremiumCard>
            <LuxuryBadge>Calendario ciclico opcional</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl text-[#f3eee8]">Configure sua estimativa.</h2>
            <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">As previsoes sao apenas estimativas baseadas no que voce informa e podem ser editadas.</p>
            <div className="mt-5 space-y-3">
              <Input type="date" value={lastPeriodStart} onChange={(event) => setLastPeriodStart(event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="number" min={15} max={60} value={averageCycleLength} onChange={(event) => setAverageCycleLength(Number(event.target.value))} placeholder="Duracao media do ciclo" />
                <Input type="number" min={1} max={15} value={averagePeriodLength} onChange={(event) => setAveragePeriodLength(Number(event.target.value))} placeholder="Duracao media menstrual" />
              </div>
              <Button onClick={() => post({ action: "profile", lastPeriodStart, averageCycleLength, averagePeriodLength }, "Perfil ciclico salvo.")}>
                <RefreshCw className="h-4 w-4" /> Atualizar previsao
              </Button>
            </div>
          </PremiumCard>

          <PremiumCard>
            <LuxuryBadge>Registro do dia</LuxuryBadge>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
              <Input value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Humor opcional" />
              <Input type="number" min={1} max={5} value={energyLevel} onChange={(event) => setEnergyLevel(Number(event.target.value))} placeholder="Energia 1-5" />
              <Input value={symptoms} onChange={(event) => setSymptoms(event.target.value)} placeholder="Sintomas separados por virgula" />
            </div>
            <Textarea className="mt-3" value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} placeholder="Nota privada opcional" />
            <label className="mt-3 flex items-center gap-2 text-sm text-[#cbbfb1]">
              <input type="checkbox" checked={useForAi} onChange={(event) => setUseForAi(event.target.checked)} />
              Permitir uso deste registro na IA adaptativa
            </label>
            <Button className="mt-4" onClick={() => post({ action: "entry", entryDate, mood, energyLevel, symptoms: symptoms.split(",").map((item) => item.trim()).filter(Boolean), privateNotes, useForAi }, "Registro ciclico salvo.")}>
              Salvar registro
            </Button>
          </PremiumCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <PremiumCard>
            <LuxuryBadge>Proximos dias</LuxuryBadge>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.predictions.slice(0, 14).map((item) => (
                <SoftPanel key={item.id} className="p-3">
                  <p className="font-semibold text-[#f2eadf]">{new Date(`${item.predicted_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm text-[#cbbfb1]">{item.predicted_phase}</p>
                </SoftPanel>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[#cbbfb1]">As previsoes sao estimativas e nao substituem orientacao medica.</p>
          </PremiumCard>
          <PremiumCard>
            <LuxuryBadge>Historico privado</LuxuryBadge>
            <div className="mt-4 space-y-3">
              {data.entries.map((entry) => (
                <SoftPanel key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#f2eadf]">{new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                    <span className="text-xs text-[#b79a6b]">{entry.phase}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#cbbfb1]">Humor: {entry.mood ?? "nao informado"} | Energia: {entry.energy_level ?? "-"}</p>
                </SoftPanel>
              ))}
              {!data.entries.length ? <p className="text-sm text-[#cbbfb1]">Nenhum registro ciclico ainda.</p> : null}
            </div>
          </PremiumCard>
        </div>
      </div>
    </SensitiveConsentGate>
  );
}
