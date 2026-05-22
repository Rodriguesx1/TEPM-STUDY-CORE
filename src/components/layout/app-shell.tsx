"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  CreditCard,
  FileText,
  Focus,
  LayoutDashboard,
  MessageCircle,
  Network,
  NotebookPen,
  Presentation,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Waves,
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
            { href: "/dashboard/cycle", label: "Ciclo", description: "Calendario ciclico opcional", icon: Waves },
            { href: "/dashboard/journal", label: "Diario", description: "Reflexoes privadas opt-in", icon: NotebookPen },
            { href: "/dashboard/productivity", label: "Produtividade", description: "Foco, pomodoro e escuta", icon: Focus },
            { href: "/dashboard/notifications", label: "Notificacoes", description: "Push, sons e preferencias", icon: Bell },
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

function mobileNavItems(isAdmin: boolean) {
  return [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/biblioteca", label: "PDFs", icon: FileText },
    { href: "/chat", label: "IA", icon: Brain },
    { href: "/dashboard/journal", label: "Diario", icon: NotebookPen },
    isAdmin
      ? { href: "/admin", label: "Admin", icon: Shield }
      : { href: "/trilhas", label: "Trilhas", icon: BookOpen },
  ];
}

export function AppShell({ children, context }: { children: React.ReactNode; context: SessionContext }) {
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#6fae9b]/16 bg-[#071412]/78 px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:px-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="min-w-0">
              <p className="font-serif text-2xl font-semibold leading-none text-[#f3eee8] sm:text-3xl">TEPM Study</p>
              <p className="mt-1 max-w-[12rem] truncate text-xs text-[#cbbfb1] sm:max-w-none sm:text-sm">{context.email}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <Badge className={context.hasPremiumAccess ? "hidden border-[#b79a6b]/40 text-[#f2eadf] sm:inline-flex" : "hidden text-destructive sm:inline-flex"}>
                {context.isAdmin ? "Admin" : context.hasPremiumAccess ? "Licenca ativa" : "Acesso limitado"}
              </Badge>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sair
                </Button>
              </form>
            </div>
          </div>
          <div className="hidden md:block">
            <DropdownNavigation navItems={buildNavItems(context.isAdmin)} />
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-dvh max-w-7xl p-4 pb-10 sm:p-5 sm:pb-12 md:p-8 md:pb-14">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[26px] border border-[#6fae9b]/22 bg-[#071412]/88 px-2 py-2 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavItems(context.isAdmin).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[11px] font-bold text-[#f3eee8] transition active:bg-[#1e5f55]/40"
              >
                <Icon className="h-4 w-4 text-[#6fae9b]" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
