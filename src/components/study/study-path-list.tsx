"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type StudyPathModule = {
  title?: string;
  priority?: string;
  difficulty?: string;
  documents?: string[];
  goals?: string[];
  review?: string;
};

type StudyPathPlan = {
  modules?: StudyPathModule[];
  seven_day_plan?: Array<Record<string, unknown>>;
  thirty_day_plan?: Array<Record<string, unknown>>;
  review?: string;
  fixation_questions?: string[];
  gaps?: string[];
};

type StudyPathRecord = {
  id: string;
  title: string | null;
  description: string | null;
  modules: unknown;
};

function normalizePlan(value: unknown) {
  if (Array.isArray(value)) {
    return { modules: value as StudyPathModule[], sevenDay: [], thirtyDay: [], questions: [], gaps: [], review: null as string | null };
  }

  const plan = (value ?? {}) as StudyPathPlan;
  return {
    modules: Array.isArray(plan.modules) ? plan.modules : [],
    sevenDay: Array.isArray(plan.seven_day_plan) ? plan.seven_day_plan : [],
    thirtyDay: Array.isArray(plan.thirty_day_plan) ? plan.thirty_day_plan : [],
    questions: Array.isArray(plan.fixation_questions) ? plan.fixation_questions : [],
    gaps: Array.isArray(plan.gaps) ? plan.gaps : [],
    review: typeof plan.review === "string" ? plan.review : null,
  };
}

function describePlanItem(item: Record<string, unknown>) {
  return Object.entries(item)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export function StudyPathList({ paths }: { paths: StudyPathRecord[] }) {
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  if (!paths.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma trilha criada ainda. A geracao automatica sera liberada apos materiais processados.</p>;
  }

  return (
    <>
      {paths.map((path) => {
        const plan = normalizePlan(path.modules);
        const pathCollapsed = collapsedPaths[path.id] ?? false;

        return (
          <article key={path.id} className="space-y-4 rounded-[16px] border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-[#14352f]">{path.title}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{path.description}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCollapsedPaths((current) => ({ ...current, [path.id]: !pathCollapsed }))}
                aria-expanded={!pathCollapsed}
              >
                {pathCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {pathCollapsed ? "Maximizar" : "Minimizar"}
              </Button>
            </div>

            {pathCollapsed ? (
              <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">
                Trilha minimizada. {plan.modules.length} modulo{plan.modules.length === 1 ? "" : "s"} organizado{plan.modules.length === 1 ? "" : "s"}.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  {plan.modules.map((module, index) => {
                    const blockKey = `${path.id}-module-${index}`;
                    const blockCollapsed = collapsedBlocks[blockKey] ?? false;

                    return (
                      <section key={blockKey} className="min-w-0 rounded-[14px] border bg-[#f3fbf6] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="break-words font-semibold text-[#2a1026]">{module.title ?? `Modulo ${index + 1}`}</h4>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {module.priority ? <span className="rounded-full border bg-white px-2 py-1">Prioridade: {module.priority}</span> : null}
                              {module.difficulty ? <span className="rounded-full border bg-white px-2 py-1">Dificuldade: {module.difficulty}</span> : null}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCollapsedBlocks((current) => ({ ...current, [blockKey]: !blockCollapsed }))}
                            aria-expanded={!blockCollapsed}
                          >
                            {blockCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            {blockCollapsed ? "Maximizar" : "Minimizar"}
                          </Button>
                        </div>

                        {blockCollapsed ? (
                          <p className="mt-3 rounded-[12px] bg-white/70 p-3 text-sm text-muted-foreground">Modulo minimizado para manter a trilha limpa.</p>
                        ) : (
                          <>
                            {module.documents?.length ? <p className="mt-3 break-words text-xs text-muted-foreground">Materiais: {module.documents.join(", ")}</p> : null}
                            {module.goals?.length ? (
                              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                                {module.goals.map((goal) => <li key={goal} className="break-words">- {goal}</li>)}
                              </ul>
                            ) : null}
                            {module.review ? <p className="mt-3 break-words text-xs text-[#2f7d69]">{module.review}</p> : null}
                          </>
                        )}
                      </section>
                    );
                  })}
                </div>

                {(plan.sevenDay.length || plan.thirtyDay.length) ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {plan.sevenDay.length ? (
                      <section className="min-w-0 rounded-[14px] border bg-[#fbf7f3] p-3">
                        <h4 className="font-semibold text-[#14352f]">Plano de 7 dias</h4>
                        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                          {plan.sevenDay.map((item, index) => <p key={index} className="break-words">{describePlanItem(item)}</p>)}
                        </div>
                      </section>
                    ) : null}
                    {plan.thirtyDay.length ? (
                      <section className="min-w-0 rounded-[14px] border bg-[#fbf7f3] p-3">
                        <h4 className="font-semibold text-[#14352f]">Plano de 30 dias</h4>
                        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                          {plan.thirtyDay.map((item, index) => <p key={index} className="break-words">{describePlanItem(item)}</p>)}
                        </div>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                {plan.review ? <p className="break-words rounded-[14px] border bg-white p-3 text-sm text-muted-foreground">{plan.review}</p> : null}
                {plan.questions.length ? (
                  <section className="min-w-0 rounded-[14px] border bg-white p-3">
                    <h4 className="font-semibold text-[#14352f]">Perguntas de fixacao</h4>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {plan.questions.map((question) => <li key={question} className="break-words">- {question}</li>)}
                    </ul>
                  </section>
                ) : null}

                {!plan.modules.length ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">Esta trilha antiga nao possui modulos detalhados. Gere uma nova trilha para criar um plano especifico.</p> : null}
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
