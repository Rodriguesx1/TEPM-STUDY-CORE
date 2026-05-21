"use client";

import { useEffect, useState } from "react";
import { Brain, Check, Cpu, FileText, Lightbulb, Repeat, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Overview = {
  memory: Array<{ id: string; memory_type: string; title: string; content: string; confidence: number; last_seen_at: string }>;
  revisions: Array<{ id: string; title: string; theme: string | null; priority: string; due_at: string; retention_score: number }>;
  retention: Array<{ id: string; theme: string | null; score: number; next_review_at: string | null }>;
  patterns: Array<{ id: string; pattern_type: string; title: string; description: string; severity: string }>;
  materials: Array<{ id: string; material_type: string; title: string; status: string; created_at: string }>;
  costs: { cents30d: number; tokens30d: number; cached: number };
  runs: Array<{ agent_name: string; task_type: string; provider: string | null; token_estimate: number; started_at: string }>;
  recommendations: Array<{ title: string; reason: string; priority: string; action: string }>;
};

const empty: Overview = {
  memory: [],
  revisions: [],
  retention: [],
  patterns: [],
  materials: [],
  costs: { cents30d: 0, tokens30d: 0, cached: 0 },
  runs: [],
  recommendations: [],
};

export function IntelligencePanel() {
  const [data, setData] = useState<Overview>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/intelligence/overview", { cache: "no-store" });
      const payload = (await response.json()) as Overview & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar inteligencia.");
      setData(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar inteligencia.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function post(body: Record<string, unknown>, success: string) {
    setWorking(true);
    setMessage(null);
    try {
      const response = await fetch("/api/intelligence/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao executar agente.");
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao executar agente.");
    } finally {
      setWorking(false);
    }
  }

  const stats = [
    { label: "Memorias", value: data.memory.length, icon: Brain },
    { label: "Revisoes", value: data.revisions.length, icon: Repeat },
    { label: "Agentes 30d", value: data.runs.length, icon: Cpu },
    { label: "Custo IA", value: `${data.costs.cents30d.toFixed(2)} c`, icon: WalletCards },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {message ? <p className="rounded-[16px] border bg-[#eef8f2] p-3 text-sm text-[#14352f]">{message}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><stat.icon className="h-4 w-4 text-[#2f7d69]" />{stat.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-[#14352f]">{loading ? "..." : stat.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#c7a64b]" />Recomendacao inteligente</CardTitle>
            <CardDescription>Gerada a partir de revisoes pendentes, PDFs processados e memoria evolutiva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recommendations.map((item) => (
              <article key={`${item.title}-${item.action}`} className="rounded-[16px] border bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="break-words font-semibold text-[#14352f]">{item.title}</h3>
                  <span className="rounded-full bg-[#eef8f2] px-2 py-1 text-xs font-semibold text-[#2f7d69]">{item.priority}</span>
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">{item.reason}</p>
                <p className="mt-2 break-words text-sm text-[#604758]">{item.action}</p>
              </article>
            ))}
            {!data.recommendations.length ? <p className="text-sm text-muted-foreground">Sem dados suficientes para recomendar. Envie materiais ou conclua revisoes.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geracao avancada</CardTitle>
            <CardDescription>Apostilas, resumos premium, quizzes, flashcards e roteiros com base nos PDFs processados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ["resumo_premium", "Resumo premium"],
              ["flashcards", "Flashcards"],
              ["quiz", "Quiz"],
              ["roteiro_aula", "Roteiro de aula"],
            ].map(([materialType, label]) => (
              <Button key={materialType} type="button" variant={materialType === "resumo_premium" ? "primary" : "outline"} disabled={working} onClick={() => post({ materialType }, `${label} gerado.`)}>
                <Sparkles className="h-4 w-4" />{label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Memory Core</CardTitle>
            <CardDescription>Temas, dificuldades e preferencias registrados por interacoes reais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.memory.map((item) => (
              <details key={item.id} className="rounded-[14px] border bg-white p-3">
                <summary className="cursor-pointer list-none font-semibold text-[#14352f]">{item.title}</summary>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#2f7d69]">{item.memory_type} - {(Number(item.confidence) * 100).toFixed(0)}%</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.content}</p>
              </details>
            ))}
            {!data.memory.length ? <p className="text-sm text-muted-foreground">A memoria evolutiva sera criada conforme voce usa a Mentora IA e conclui revisoes.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fila cognitiva de revisao</CardTitle>
            <CardDescription>Spaced repetition com prioridade dinamica e score de retencao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.revisions.map((item) => (
              <article key={item.id} className="rounded-[14px] border bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="break-words font-semibold text-[#14352f]">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.theme ?? "Sem tema"} - {new Date(item.due_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" disabled={working} onClick={() => post({ action: "complete_revision", title: item.id }, "Revisao concluida.")}>
                    <Check className="h-4 w-4" />Concluir
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Retencao estimada: {Number(item.retention_score).toFixed(0)}%</p>
              </article>
            ))}
            {!data.revisions.length ? <p className="text-sm text-muted-foreground">Nenhuma revisao pendente agora.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materiais e agentes</CardTitle>
          <CardDescription>Execucoes recentes do ecossistema multiagente e materiais persistidos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            {data.materials.map((item) => (
              <p key={item.id} className="break-words rounded-[14px] border bg-white p-3 text-sm"><FileText className="mr-2 inline h-4 w-4 text-[#2f7d69]" />{item.material_type}: {item.title}</p>
            ))}
            {!data.materials.length ? <p className="text-sm text-muted-foreground">Nenhum material avancado gerado ainda.</p> : null}
          </div>
          <div className="space-y-2">
            {data.runs.map((run) => (
              <p key={`${run.agent_name}-${run.started_at}`} className="break-words rounded-[14px] border bg-[#fbf7f3] p-3 text-sm">{run.agent_name} - {run.task_type} - {run.provider ?? "sem provedor"} - {run.token_estimate} tokens</p>
            ))}
            {!data.runs.length ? <p className="text-sm text-muted-foreground">Os agentes serao registrados a partir das proximas perguntas e geracoes.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
