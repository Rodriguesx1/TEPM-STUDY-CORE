"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CreditCard,
  FileText,
  Focus,
  LayoutDashboard,
  MessageCircle,
  Network,
  Presentation,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownNavigation, type DropdownNavItem } from "@/components/ui/dorpdown-navigation";
import type { SessionContext } from "@/lib/auth/guards";

function buildNavItems(isAdmin: boolean): DropdownNavItem[] {
  const items: DropdownNavItem[] = [
    {
      id: 1,
      label: "Centro",
      subMenus: [
        {
          title: "Base de estudo",
          items: [
            { href: "/dashboard", label: "Dashboard", description: "Visao geral e proximas acoes", icon: LayoutDashboard },
            { href: "/biblioteca", label: "Biblioteca", description: "PDFs, chunks e memoria", icon: FileText },
            { href: "/caderno", label: "Caderno", description: "Notas, scripts e reflexoes", icon: MessageCircle },
            { href: "/trilhas", label: "Trilhas", description: "Planos de estudo por tema", icon: BookOpen },
          ],
        },
        {
          title: "Rotina",
          items: [
            { href: "/dashboard/calendar", label: "Calendario", description: "Tarefas, revisoes e metas", icon: CalendarDays },
            { href: "/dashboard/productivity", label: "Produtividade", description: "Foco, pomodoro e escuta", icon: Focus },
            { href: "/dashboard/reports", label: "Relatorios", description: "Evolucao, lacunas e desempenho", icon: BarChart3 },
          ],
        },
      ],
    },
    {
      id: 2,
      label: "IA",
      subMenus: [
        {
          title: "Mentoria e memoria",
          items: [
            { href: "/chat", label: "Mentora IA", description: "Chat RAG com fontes", icon: Brain },
            { href: "/dashboard/intelligence", label: "Inteligencia", description: "Memory Core e multiagentes", icon: Sparkles },
            { href: "/dashboard/ecosystem", label: "Ecossistema", description: "Realtime, marketplace e offline", icon: Rocket },
          ],
        },
        {
          title: "Materiais",
          items: [
            { href: "/dashboard/mind-maps", label: "Mapas mentais", description: "Visualizacao interativa Mind Elixir", icon: Network },
            { href: "/dashboard/slides", label: "Slides", description: "Apresentacoes editaveis", icon: Presentation },
            { href: "/dashboard/videos", label: "Videos", description: "Aulas e transcricoes", icon: Video },
          ],
        },
      ],
    },
    {
      id: 3,
      label: "Comunidade",
      subMenus: [
        {
          title: "Colaboracao",
          items: [
            { href: "/comunidade", label: "Salas", description: "Grupos privados e mensagens", icon: Users },
            { href: "/dashboard/community", label: "Comunidade avançada", description: "Acesso por codigo e historico", icon: Users },
          ],
        },
        {
          title: "Seguranca",
          items: [
            { href: "/dashboard/privacy", label: "Privacidade", description: "LGPD, exportacao e exclusao", icon: ShieldCheck },
          ],
        },
      ],
    },
  ];

  if (isAdmin) {
    items.push({
      id: 4,
      label: "Admin",
      subMenus: [
        {
          title: "Gestao",
          items: [
            { href: "/admin", label: "Admin Master", description: "Usuarios, licencas e logs", icon: Shield },
            { href: "/admin/billing", label: "Financeiro", description: "Planos, cupons e historico", icon: CreditCard },
          ],
        },
      ],
    });
  }

  return items;
}

export function AppShell({ children, context }: { children: React.ReactNode; context: SessionContext }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/82 px-3 py-3 backdrop-blur sm:px-4 md:px-8 dark:bg-[#172522]/88">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/dashboard" className="min-w-0">
              <p className="font-serif text-xl font-bold text-[#183c35] sm:text-2xl">TEPM Study</p>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{context.email}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <Badge className={context.hasPremiumAccess ? "border-[#d7bb5f] text-[#795b13]" : "text-destructive"}>
                {context.isAdmin ? "Admin" : context.hasPremiumAccess ? "Licenca ativa" : "Acesso limitado"}
              </Badge>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sair
                </Button>
              </form>
            </div>
          </div>
          <DropdownNavigation navItems={buildNavItems(context.isAdmin)} />
        </div>
      </header>
      <main className="mx-auto min-h-dvh max-w-7xl p-3 pb-10 sm:p-4 sm:pb-12 md:p-8 md:pb-14">{children}</main>
    </div>
  );
}
