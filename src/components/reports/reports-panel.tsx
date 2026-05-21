"use client";

import { useEffect, useState } from "react";
import { BarChart3, Brain, FileText, Flame, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReportPayload = {
  metrics: {
    documentsProcessed: number;
    videosProcessed: number;
    tasksCompleted: number;
    tasksPending: number;
    studyPaths: number;
    aiQuestions30d: number;
    totalPoints: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
  };
  themes: { theme: string; count: number }[];
  weeklyEvolution: { label: string; completed: number }[];
  gaps: string[];
  recommendations: string[];
  recentDocuments: { id: string; title: string; summary: string | null }[];
  recentVideos: { id: string; title: string; summary: string | null }[];
};

const empty: ReportPayload = {
  metrics: {
    documentsProcessed: 0,
    videosProcessed: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    studyPaths: 0,
    aiQuestions30d: 0,
    totalPoints: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
  },
  themes: [],
  weeklyEvolution: [],
  gaps: [],
  recommendations: [],
  recentDocuments: [],
  recentVideos: [],
};

export function ReportsPanel() {
  const [data, setData] = useState<ReportPayload>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const payload = (await response.json()) as ReportPayload & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Falha ao gerar relatorio.");
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao gerar relatorio.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const stats = [
    { label: "PDFs estudados", value: data.metrics.documentsProcessed, icon: FileText },
    { label: "Videos estudados", value: data.metrics.videosProcessed, icon: Video },
    { label: "Tarefas concluidas", value: data.metrics.tasksCompleted, icon: BarChart3 },
    { label: "Perguntas IA 30d", value: data.metrics.aiQuestions30d, icon: Brain },
    { label: "Nivel", value: data.metrics.level, icon: Flame },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? <div className="rounded-[16px] border border-destructive/30 bg-[#fff1f2] p-3 text-sm text-destructive">{error}</div> : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><stat.icon className="h-4 w-4 text-[#2f7d69]" />{stat.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold text-[#14352f]">{loading ? "..." : stat.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolucao semanal</CardTitle>
            <CardDescription>Baseada em tarefas realmente concluidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.weeklyEvolution.map((week) => (
              <div key={week.label}>
                <div className="mb-1 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                  <span className="break-words">{week.label}</span>
                  <span>{week.completed} concluida(s)</span>
                </div>
                <div className="h-3 rounded-full bg-[#e8f4ef]">
                  <div className="h-3 rounded-full bg-[#2f7d69]" style={{ width: `${Math.min(100, week.completed * 20)}%` }} />
                </div>
              </div>
            ))}
            {!data.weeklyEvolution.length ? <p className="text-sm text-muted-foreground">Sem tarefas concluidas no periodo.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temas mais vistos</CardTitle>
            <CardDescription>Calculado pelos PDFs processados e classificados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.themes.map((theme) => (
              <div key={theme.theme} className="flex items-center justify-between gap-3 rounded-[14px] border bg-white p-3 text-sm">
                <span className="break-words font-semibold text-[#14352f]">{theme.theme}</span>
                <Badge>{theme.count}</Badge>
              </div>
            ))}
            {!data.themes.length ? <p className="text-sm text-muted-foreground">Ainda nao ha temas suficientes.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lacunas de aprendizado</CardTitle>
            <CardDescription>Nao e gerado no vazio: as lacunas usam dados reais da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.gaps.map((gap) => (
              <p key={gap} className="rounded-[14px] bg-[#fbf7f3] p-3 text-sm">{gap}</p>
            ))}
            {!data.gaps.length ? <p className="text-sm text-muted-foreground">Nenhuma lacuna critica detectada pelos dados atuais.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendacoes</CardTitle>
            <CardDescription>Proximas acoes para retenção e evolucao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map((item) => (
              <p key={item} className="rounded-[14px] border bg-white p-3 text-sm">{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
