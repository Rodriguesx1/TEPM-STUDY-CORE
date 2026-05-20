import Link from "next/link";
import { BookOpen, Brain, FileText, LayoutDashboard, MessageCircle, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionContext } from "@/lib/auth/guards";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/biblioteca", label: "Biblioteca", icon: FileText },
  { href: "/chat", label: "Mentora IA", icon: Brain },
  { href: "/trilhas", label: "Trilhas", icon: BookOpen },
  { href: "/caderno", label: "Caderno", icon: MessageCircle },
  { href: "/comunidade", label: "Comunidade", icon: Users },
];

export function AppShell({ children, context }: { children: React.ReactNode; context: SessionContext }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/60 bg-[#211326]/95 p-5 text-white lg:block">
        <Link href="/dashboard" className="block">
          <p className="font-serif text-2xl font-bold">TEPM Study Core</p>
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
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
            >
              <Shield className="h-4 w-4 text-[#e2c875]" />
              Admin Master
            </Link>
          ) : null}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/60 bg-white/76 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-serif text-xl font-bold text-[#3a1a31]">Centro de estudos terapêuticos</p>
              <p className="text-sm text-muted-foreground">{context.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={context.hasPremiumAccess ? "border-[#d7bb5f] text-[#795b13]" : "text-destructive"}>
                {context.isAdmin ? "Admin" : context.hasPremiumAccess ? "Licença ativa" : "Acesso limitado"}
              </Badge>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sair
                </Button>
              </form>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
