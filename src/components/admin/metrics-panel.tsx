"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Brain, Database, HardDrive, Upload, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Metrics = {
  users: number;
  documents: number;
  videos: number;
  aiCalls7d: number;
  aiTokenEstimate7d: number;
  uploadErrors7d: number;
  leads: number;
  storageBytes: number;
  recentErrors: { id: string; event: string; level: string; created_at: string }[];
};

export function MetricsPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/metrics", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar metricas.");
        setMetrics(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar metricas.");
      }
    }
    void load();
  }, []);

  const stats = [
    { label: "Usuarios", value: metrics?.users ?? 0, icon: Users },
    { label: "Uploads PDF", value: metrics?.documents ?? 0, icon: Upload },
    { label: "Videos", value: metrics?.videos ?? 0, icon: Database },
    { label: "IA 7 dias", value: metrics?.aiCalls7d ?? 0, icon: Brain },
    { label: "Tokens estimados", value: metrics?.aiTokenEstimate7d ?? 0, icon: Brain },
    { label: "Storage", value: `${(((metrics?.storageBytes ?? 0) / 1024 / 1024)).toFixed(1)} MB`, icon: HardDrive },
  ];

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-[16px] border border-destructive/30 bg-[#fff1f2] p-3 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><stat.icon className="h-4 w-4 text-[#2f7d69]" />{stat.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold text-[#14352f]">{stat.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#9b2f5f]" />Erros recentes</CardTitle>
          <CardDescription>Eventos de erro vindos de `system_logs`, sem expor chaves ou conteudos sensiveis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics?.recentErrors?.map((item) => (
            <div key={item.id} className="rounded-[14px] border bg-white p-3 text-sm">
              <p className="font-semibold text-[#14352f]">{item.event}</p>
              <p className="text-xs text-muted-foreground">{item.level} - {new Date(item.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
          {!metrics?.recentErrors?.length ? <p className="text-sm text-muted-foreground">Nenhum erro critico registrado.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
