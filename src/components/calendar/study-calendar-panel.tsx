"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Flame, Plus, RefreshCw, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StudyTask = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  due_at: string | null;
  status: string;
  points_awarded: number;
};

type StudyEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  status: string;
};

type StudyGoal = {
  id: string;
  title: string;
  target_count: number;
  current_count: number;
  status: string;
};

type Suggestion = {
  title: string;
  description: string;
  source_type: string;
  source_id: string;
};

type CalendarPayload = {
  events: StudyEvent[];
  tasks: StudyTask[];
  goals: StudyGoal[];
  points: { total_points: number; level: number };
  streak: { current_streak: number; longest_streak: number };
  achievements: { id: string; achievements?: { title: string; description: string } }[];
  suggestions: Suggestion[];
  hasPremiumAccess: boolean;
};

const initialPayload: CalendarPayload = {
  events: [],
  tasks: [],
  goals: [],
  points: { total_points: 0, level: 1 },
  streak: { current_streak: 0, longest_streak: 0 },
  achievements: [],
  suggestions: [],
  hasPremiumAccess: false,
};

export function StudyCalendarPanel() {
  const [data, setData] = useState<CalendarPayload>(initialPayload);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "week" | "month">("list");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState("study");
  const [dueAt, setDueAt] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [goalTitle, setGoalTitle] = useState("");

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study/calendar", { cache: "no-store" });
      const payload = (await response.json()) as CalendarPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar calendario.");
      setData(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar calendario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleTasks = useMemo(() => {
    if (view === "list") return data.tasks;
    const now = new Date();
    const days = view === "week" ? 7 : 31;
    const limit = new Date();
    limit.setDate(now.getDate() + days);
    return data.tasks.filter((task) => task.due_at && new Date(task.due_at) <= limit);
  }, [data.tasks, view]);

  async function post(body: Record<string, unknown>, success: string) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar.");
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function completeTask(taskId: string) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const payload = (await response.json()) as { error?: string; points?: number };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao concluir tarefa.");
      setMessage(`Tarefa concluida. +${payload.points ?? 0} pontos.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao concluir tarefa.");
    } finally {
      setSaving(false);
    }
  }

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void post({ action: "task", title: taskTitle, description: taskDescription, taskType, dueAt }, "Tarefa criada.");
    setTaskTitle("");
    setTaskDescription("");
  }

  function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void post({ action: "event", title: eventTitle, eventType: "therapy_session", startsAt: eventDate }, "Sessao criada.");
    setEventTitle("");
  }

  function createGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void post({ action: "goal", title: goalTitle, targetCount: 5 }, "Meta semanal criada.");
    setGoalTitle("");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {message ? <div className="rounded-[16px] border border-[#cfe5dc] bg-[#e8f4ef] p-3 text-sm text-[#14352f]">{message}</div> : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-[#b79a45]" /> Nivel</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#14352f]">{data.points.level}</p><p className="text-sm text-muted-foreground">{data.points.total_points} pontos</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Flame className="h-4 w-4 text-[#9b2f5f]" /> Sequencia</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#14352f]">{data.streak.current_streak}</p><p className="text-sm text-muted-foreground">recorde {data.streak.longest_streak} dia(s)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-[#2f7d69]" /> Metas</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#14352f]">{data.goals.length}</p><p className="text-sm text-muted-foreground">ativas e historicas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-[#2f7d69]" /> Agenda</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#14352f]">{data.events.length}</p><p className="text-sm text-muted-foreground">eventos no periodo</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 sm:space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Criar tarefa de estudo</CardTitle>
              <CardDescription>Gera tarefa real, com vencimento e pontuacao ao concluir.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTask} className="space-y-3">
                <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex.: Revisar ciclo menstrual" required />
                <Textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Orientacao ou foco da tarefa" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="h-11 rounded-[14px] border border-input bg-white px-3 text-sm" value={taskType} onChange={(event) => setTaskType(event.target.value)}>
                    <option value="study">Estudo</option>
                    <option value="review">Revisao</option>
                    <option value="goal">Meta</option>
                    <option value="therapy_session">Sessao terapeutica simulada</option>
                  </select>
                  <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
                </div>
                <Button type="submit" disabled={saving || !data.hasPremiumAccess}><Plus className="mr-2 h-4 w-4" />Criar tarefa</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>Gera plano semanal e transforma materiais recentes em revisoes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" disabled={saving || !data.hasPremiumAccess} onClick={() => post({ action: "weekly_plan" }, "Plano semanal criado.")}>
                <RefreshCw className="mr-2 h-4 w-4" />Gerar plano semanal
              </Button>
              <div className="space-y-2">
                {data.suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.source_type}-${suggestion.source_id}`}
                    className="w-full rounded-[16px] border bg-white p-3 text-left text-sm transition hover:border-[#2f7d69]"
                    disabled={saving || !data.hasPremiumAccess}
                    onClick={() => post({ action: "task", title: suggestion.title, description: suggestion.description, taskType: "review" }, "Revisao criada a partir do material.")}
                  >
                    <span className="font-semibold text-[#14352f]">{suggestion.title}</span>
                    <span className="mt-1 block text-muted-foreground">{suggestion.description}</span>
                  </button>
                ))}
                {!data.suggestions.length ? <p className="text-sm text-muted-foreground">Sem materiais processados para sugerir revisao.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Calendario terapeutico</CardTitle>
                <CardDescription>Visual mensal, semanal ou lista com tarefas reais.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["list", "week", "month"] as const).map((item) => (
                  <Button key={item} type="button" size="sm" variant={view === item ? "primary" : "outline"} onClick={() => setView(item)}>
                    {item === "list" ? "Lista" : item === "week" ? "Semana" : "Mes"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Carregando agenda...</p> : null}
            {visibleTasks.map((task) => (
              <article key={task.id} className="rounded-[16px] border bg-[#fbf7f3] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-[#2a1026]">{task.title}</h3>
                    {task.description ? <p className="mt-1 break-words text-sm text-muted-foreground">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{task.task_type}</Badge>
                      <Badge>{task.priority}</Badge>
                      {task.due_at ? <Badge>{new Date(task.due_at).toLocaleString("pt-BR")}</Badge> : null}
                    </div>
                  </div>
                  {task.status === "completed" ? (
                    <Badge className="bg-[#e8f4ef] text-[#14352f]">+{task.points_awarded} pontos</Badge>
                  ) : (
                    <Button size="sm" disabled={saving} onClick={() => completeTask(task.id)}><Check className="mr-2 h-4 w-4" />Concluir</Button>
                  )}
                </div>
              </article>
            ))}
            {!loading && !visibleTasks.length ? <p className="rounded-[16px] border bg-white p-4 text-sm text-muted-foreground">Nenhuma tarefa neste filtro.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sessao terapeutica simulada</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createEvent} className="space-y-3">
              <Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Tema da sessao" required />
              <Input type="datetime-local" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required />
              <Button type="submit" disabled={saving || !data.hasPremiumAccess}>Criar sessao</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Meta semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createGoal} className="space-y-3">
              <Input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Ex.: concluir 5 revisoes" required />
              <Button type="submit" disabled={saving || !data.hasPremiumAccess}>Criar meta</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
