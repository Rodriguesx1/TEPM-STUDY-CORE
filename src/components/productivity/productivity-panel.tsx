"use client";

import { useEffect, useState } from "react";
import { Clock, Focus, Headphones, Play, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Session = {
  id: string;
  mode: string;
  title: string;
  duration_minutes: number;
  started_at: string;
};

export function ProductivityPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [title, setTitle] = useState("Sessao de foco terapeutico");
  const [duration, setDuration] = useState(25);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch("/api/productivity", { cache: "no-store" });
    const payload = (await response.json()) as { sessions?: Session[]; totalMinutes?: number; error?: string };
    if (response.ok) {
      setSessions(payload.sessions ?? []);
      setTotalMinutes(payload.totalMinutes ?? 0);
    } else {
      setMessage(payload.error ?? "Falha ao carregar produtividade.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createSession(mode: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, title, durationMinutes: duration }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao registrar sessao.");
      setMessage("Sessao registrada e enviada para a memoria evolutiva.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar sessao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {message ? <p className="rounded-[16px] border bg-[#eef8f2] p-3 text-sm text-[#14352f]">{message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="premium-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Focus className="h-5 w-5 text-[#2f7d69]" />Modo foco</CardTitle>
            <CardDescription>Cronometro simples, registro real e base para futuras musicas/voz/avatar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome da sessao" />
            <Input type="number" min={5} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
            <div className="flex flex-wrap gap-2">
              <Button disabled={loading} onClick={() => createSession("focus")}><Play className="h-4 w-4" />Foco</Button>
              <Button disabled={loading} variant="secondary" onClick={() => createSession("pomodoro")}><TimerReset className="h-4 w-4" />Pomodoro</Button>
              <Button disabled={loading} variant="outline" onClick={() => createSession("listen")}><Headphones className="h-4 w-4" />Modo escuta</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produtividade acumulada</CardTitle>
            <CardDescription>Sessoes reais registradas no banco, isoladas por usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-5xl font-bold text-[#14352f]">{totalMinutes}</p>
            <p className="mt-1 text-sm text-muted-foreground">minutos registrados</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historico de sessoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-[14px] border bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-words font-semibold text-[#14352f]">{session.title}</p>
                <span className="rounded-full bg-[#eef8f2] px-2 py-1 text-xs font-semibold text-[#2f7d69]">{session.mode}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{session.duration_minutes} min - {new Date(session.started_at).toLocaleString("pt-BR")}</p>
            </article>
          ))}
          {!sessions.length ? <p className="text-sm text-muted-foreground">Nenhuma sessao registrada ainda.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
