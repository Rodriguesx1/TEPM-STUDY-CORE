"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { SensitiveConsentGate } from "@/components/sensitive/sensitive-consent-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LuxuryBadge, PremiumCard, SoftPanel } from "@/components/ui/premium";

type Entry = {
  id: string;
  title: string | null;
  mood: string | null;
  energy_level: number | null;
  tags: string[];
  content: string;
  use_for_ai: boolean;
  created_at: string;
};

type Insight = { id: string; journal_entry_id: string; insight: string; safety_note: string; created_at: string };

export function JournalPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [dreams, setDreams] = useState("");
  const [useForAi, setUseForAi] = useState(false);
  const [generateInsight, setGenerateInsight] = useState(false);

  async function load() {
    const response = await fetch("/api/journal", { cache: "no-store" });
    const payload = (await response.json()) as { entries?: Entry[]; insights?: Insight[]; error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel carregar diario.");
      return;
    }
    setEntries(payload.entries ?? []);
    setInsights(payload.insights ?? []);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, mood, energyLevel, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), content, dreams, useForAi, generateInsight }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao salvar diario.");
      return;
    }
    setMessage("Entrada salva com privacidade.");
    setTitle("");
    setContent("");
    setDreams("");
    await load();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao excluir entrada.");
      return;
    }
    setMessage("Entrada excluida.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SensitiveConsentGate featureName="emotional_journal">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PremiumCard>
          <LuxuryBadge>Diario emocional privado</LuxuryBadge>
          <h2 className="mt-4 font-serif text-4xl text-[#f3eee8]">Registro seguro do dia.</h2>
          <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">Voce decide se um texto pode ou nao ser usado pela IA.</p>
          {message ? <p className="mt-4 rounded-[14px] bg-[#0d2b26] p-3 text-sm text-[#f2eadf]">{message}</p> : null}
          <form onSubmit={save} className="mt-5 space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo opcional" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Humor" />
              <Input type="number" min={1} max={5} value={energyLevel} onChange={(event) => setEnergyLevel(Number(event.target.value))} placeholder="Energia 1-5" />
            </div>
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags separadas por virgula" />
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escreva sua reflexao privada" required />
            <Textarea value={dreams} onChange={(event) => setDreams(event.target.value)} placeholder="Sonhos ou percepcoes opcionais" />
            <label className="flex items-center gap-2 text-sm text-[#cbbfb1]">
              <input type="checkbox" checked={useForAi} onChange={(event) => setUseForAi(event.target.checked)} />
              Permitir uso desta entrada pela IA
            </label>
            <label className="flex items-center gap-2 text-sm text-[#cbbfb1]">
              <input type="checkbox" checked={generateInsight} onChange={(event) => setGenerateInsight(event.target.checked)} disabled={!useForAi} />
              Gerar insight com IA autorizada
            </label>
            <Button type="submit">Salvar diario</Button>
          </form>
        </PremiumCard>

        <div className="space-y-5">
          <PremiumCard>
            <LuxuryBadge>Entradas recentes</LuxuryBadge>
            <div className="mt-4 space-y-3">
              {entries.map((entry) => (
                <SoftPanel key={entry.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#f2eadf]">{entry.title ?? "Registro sem titulo"}</h3>
                      <p className="mt-1 text-xs text-[#cbbfb1]">{new Date(entry.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => remove(entry.id)} aria-label="Excluir entrada do diario">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#cbbfb1]">{entry.content}</p>
                </SoftPanel>
              ))}
              {!entries.length ? <p className="text-sm text-[#cbbfb1]">Nenhuma entrada privada ainda.</p> : null}
            </div>
          </PremiumCard>

          <PremiumCard>
            <LuxuryBadge>Insights autorizados</LuxuryBadge>
            <div className="mt-4 space-y-3">
              {insights.map((insight) => (
                <SoftPanel key={insight.id}>
                  <p className="text-sm leading-7 text-[#f2eadf]">{insight.insight}</p>
                  <p className="mt-2 text-xs text-[#b79a6b]">{insight.safety_note}</p>
                </SoftPanel>
              ))}
              {!insights.length ? <p className="text-sm text-[#cbbfb1]">Nenhum insight gerado com permissao ainda.</p> : null}
            </div>
          </PremiumCard>
        </div>
      </div>
    </SensitiveConsentGate>
  );
}
