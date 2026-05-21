import { AppShell } from "@/components/layout/app-shell";
import { StudyPathGenerator } from "@/components/study/study-path-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePremium } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";

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

export default async function StudyPathsPage() {
  const context = await requirePremium();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("study_paths").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });

  return (
    <AppShell context={context}>
      <Card>
        <CardHeader>
          <CardTitle>Trilhas de estudo</CardTitle>
          <CardDescription>Planos por modulo, prioridade, dificuldade, revisao e progresso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
          <StudyPathGenerator disabled={!context.hasPremiumAccess} />

          {data?.map((path) => {
            const plan = normalizePlan(path.modules);
            return (
              <article key={path.id} className="space-y-4 rounded-[16px] border bg-white p-4">
                <details open className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-[#14352f]">{path.title}</h3>
                      <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{path.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border bg-[#eef8f2] px-3 py-1 text-xs font-semibold text-[#14352f] group-open:hidden">Maximizar</span>
                    <span className="hidden shrink-0 rounded-full border bg-[#eef8f2] px-3 py-1 text-xs font-semibold text-[#14352f] group-open:inline-flex">Minimizar</span>
                  </summary>

                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 lg:grid-cols-2">
                      {plan.modules.map((module, index) => (
                        <section key={`${path.id}-module-${index}`} className="min-w-0 rounded-[14px] border bg-[#f3fbf6] p-3">
                          <h4 className="break-words font-semibold text-[#2a1026]">{module.title ?? `Modulo ${index + 1}`}</h4>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {module.priority ? <span className="rounded-full border bg-white px-2 py-1">Prioridade: {module.priority}</span> : null}
                            {module.difficulty ? <span className="rounded-full border bg-white px-2 py-1">Dificuldade: {module.difficulty}</span> : null}
                          </div>
                          {module.documents?.length ? <p className="mt-3 break-words text-xs text-muted-foreground">Materiais: {module.documents.join(", ")}</p> : null}
                          {module.goals?.length ? (
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                              {module.goals.map((goal) => <li key={goal} className="break-words">- {goal}</li>)}
                            </ul>
                          ) : null}
                          {module.review ? <p className="mt-3 break-words text-xs text-[#2f7d69]">{module.review}</p> : null}
                        </section>
                      ))}
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
                </details>
              </article>
            );
          })}
          {!data?.length ? <p className="text-sm text-muted-foreground">Nenhuma trilha criada ainda. A geracao automatica sera liberada apos materiais processados.</p> : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
