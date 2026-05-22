import Link from "next/link";
import { ArrowRight, BookOpenCheck, Brain, CalendarDays, FileText, NotebookPen, Sparkles } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LuxuryBadge, PremiumCard, SoftPanel } from "@/components/ui/premium";
import { requireUser } from "@/lib/auth/guards";
import { getLicenseLabel } from "@/lib/licenses/guards";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await requireUser();
  const supabase = await getServerSupabase();
  const [documents, notes, paths, activities] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("study_paths").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    supabase.from("audit_logs").select("id,action,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(5),
  ]);

  const hasDocuments = Boolean(documents.count);
  const recommended = hasDocuments
    ? { title: "Converse com a Mentora IA", description: "Use seus materiais processados para esclarecer, revisar e aplicar conteudos.", href: "/chat", icon: Brain }
    : { title: "Envie seu primeiro PDF", description: "Comece transformando um material autorizado em memoria pesquisavel.", href: "/biblioteca", icon: FileText };

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        {!context.hasPremiumAccess ? (
          <PremiumCard className="border-destructive/40 bg-[#2a1117]/70">
            <h2 className="font-serif text-3xl text-[#f3eee8]">Licenca necessaria</h2>
            <p className="mt-2 text-sm leading-7 text-[#f2eadf]">Sua conta existe, mas os recursos premium exigem licenca ativa, vitalicia ou trial valido.</p>
          </PremiumCard>
        ) : null}

        <PremiumCard className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <LuxuryBadge>Centro de estudo</LuxuryBadge>
            <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-[#f3eee8] sm:text-6xl">
              Bem-vinda ao seu ambiente cognitivo.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-[#cbbfb1]">
              Continue com calma. O foco aqui e transformar materiais acumulados em direcao, revisao e aplicacao terapeutica.
            </p>
          </div>
          <SoftPanel className="p-5">
            <div className="flex items-start gap-4">
              <recommended.icon className="mt-1 h-6 w-6 shrink-0 text-[#6fae9b]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b79a6b]">Proximo passo recomendado</p>
                <h2 className="mt-3 font-serif text-3xl text-[#f3eee8]">{recommended.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{recommended.description}</p>
                <Link href={recommended.href}>
                  <Button className="mt-5">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </SoftPanel>
        </PremiumCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="PDFs enviados" value={String(documents.count ?? 0)} detail="Arquivos processados" />
          <StatCard label="Anotacoes" value={String(notes.count ?? 0)} detail="Caderno terapeutico" />
          <StatCard label="Trilhas" value={String(paths.count ?? 0)} detail="Planos de estudo ativos" />
          <StatCard label="Licenca" value={getLicenseLabel(context.license, context.isAdmin)} detail="Controle real da plataforma" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <PremiumCard>
            <LuxuryBadge>Acoes inteligentes</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl text-[#f3eee8]">Continue seus estudos sem dispersao.</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { href: "/biblioteca", label: "Enviar PDF", icon: FileText, primary: true },
                { href: "/chat", label: "Conversar com IA", icon: Brain, primary: true },
                { href: "/trilhas", label: "Gerar trilha", icon: BookOpenCheck },
                { href: "/caderno", label: "Abrir caderno", icon: NotebookPen },
                { href: "/dashboard/calendar", label: "Revisoes", icon: CalendarDays },
                { href: "/dashboard/mind-maps", label: "Mapas mentais", icon: Sparkles },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button className="w-full justify-start" variant={action.primary ? "primary" : "outline"}>
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard>
            <LuxuryBadge>Ativacao inicial</LuxuryBadge>
            <div className="mt-5 space-y-3">
              {[
                { label: "Enviar primeiro PDF", done: Boolean(documents.count) },
                { label: "Criar uma anotacao", done: Boolean(notes.count) },
                { label: "Gerar trilha", done: Boolean(paths.count) },
                { label: "Abrir calendario", done: false },
              ].map((item) => (
                <SoftPanel key={item.label} className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#f2eadf]">{item.label}</p>
                  <span className={item.done ? "text-sm font-bold text-[#6fae9b]" : "text-sm text-[#cbbfb1]"}>{item.done ? "Concluido" : "Pendente"}</span>
                </SoftPanel>
              ))}
            </div>
          </PremiumCard>
        </div>

        <PremiumCard>
          <LuxuryBadge>Ultimas atividades</LuxuryBadge>
          <div className="mt-5 space-y-3">
            {activities.data?.map((activity) => (
              <SoftPanel key={activity.id} className="p-4">
                <p className="font-semibold text-[#f2eadf]">{activity.action}</p>
                <p className="mt-1 text-xs text-[#cbbfb1]">{new Date(activity.created_at).toLocaleString("pt-BR")}</p>
              </SoftPanel>
            ))}
            {!activities.data?.length ? <p className="text-sm text-[#cbbfb1]">Nenhuma atividade registrada ainda.</p> : null}
          </div>
        </PremiumCard>
      </div>
    </AppShell>
  );
}
