import Link from "next/link";
import { BarChart3, BookOpen, Brain, CalendarDays, CreditCard, FileText, Focus, LayoutDashboard, MessageCircle, Presentation, Shield, ShieldCheck, Sparkles, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/guards";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/biblioteca", label: "Biblioteca", icon: FileText },
  { href: "/dashboard/videos", label: "Videos", icon: Video },
  { href: "/chat", label: "Mentora IA", icon: Brain },
  { href: "/dashboard/intelligence", label: "Inteligencia", icon: Sparkles },
  { href: "/trilhas", label: "Trilhas", icon: BookOpen },
  { href: "/dashboard/productivity", label: "Produtividade", icon: Focus },
  { href: "/dashboard/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/dashboard/reports", label: "Relatorios", icon: BarChart3 },
  { href: "/dashboard/privacy", label: "Privacidade", icon: ShieldCheck },
  { href: "/dashboard/slides", label: "Slides", icon: Presentation },
  { href: "/caderno", label: "Caderno", icon: MessageCircle },
  { href: "/comunidade", label: "Comunidade", icon: Users },
];

export function AppShell({ children, context }: { children: React.ReactNode; context: SessionContext }) {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/60 bg-[#14352f]/95 p-5 text-white lg:block">
        <Link href="/dashboard" className="block">
          <p className="font-serif text-2xl font-bold">TEPM Study</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[#e2c875]">Therapeutic AI</p>
        </Link>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4 text-[#e2c875]" />
              {item.label}
            </Link>
          ))}
          {context.isAdmin ? (
            <>
              <Link href="/admin" className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white">
                <Shield className="h-4 w-4 text-[#e2c875]" />
                Admin Master
              </Link>
              <Link href="/admin/billing" className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white">
                <CreditCard className="h-4 w-4 text-[#e2c875]" />
                Financeiro
              </Link>
            </>
          ) : null}
        </nav>
      </aside>
      <main className="min-h-dvh lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/60 bg-white/82 px-3 py-3 backdrop-blur sm:px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-serif text-lg font-bold text-[#183c35] sm:text-xl">Centro de estudos terapeuticos</p>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{context.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="p-3 pb-10 sm:p-4 sm:pb-12 md:p-8 md:pb-14">{children}</div>
      </main>
    </div>
  );
}
