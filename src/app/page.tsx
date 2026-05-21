import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Brain, FileText, Lock, Users } from "lucide-react";
import { LgpdConsentBanner } from "@/components/privacy/lgpd-consent-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShinyButton } from "@/components/ui/shiny-button";

const features = [
  { title: "Biblioteca inteligente", description: "PDFs deixam de ficar espalhados e viram memoria pesquisavel.", icon: FileText },
  { title: "Mentora IA com RAG", description: "A IA responde citando os materiais processados, sem fingir contexto.", icon: Brain },
  { title: "Licencas e comunidade", description: "Planos, validade, salas privadas e permissao por membro.", icon: Users },
  { title: "LGPD e seguranca", description: "Dados isolados por usuario, consentimento de upload e logs de acesso.", icon: Lock },
];

const pains = [
  "Aulas e PDFs acumulados sem direcao",
  "Dificuldade para revisar e lembrar conteudos",
  "Tempo perdido procurando scripts, resumos e temas",
  "Necessidade de transformar estudo em pratica terapeutica",
];

const plans = [
  { name: "Free", description: "Entrada limitada para conhecer a plataforma.", message: "Ola, quero conhecer o plano Free do TEPM Study." },
  { name: "Estudante", description: "PDFs, caderno e chat IA para rotina individual.", message: "Ola, quero informacoes sobre o plano Estudante do TEPM Study." },
  { name: "Premium", description: "Trilhas, mapas mentais e comunidade privada.", message: "Ola, quero informacoes sobre o plano Premium do TEPM Study." },
  { name: "Profissional", description: "Licencas, grupos, auditoria e painel admin.", message: "Ola, quero informacoes sobre o plano Profissional do TEPM Study." },
];

export const metadata: Metadata = {
  title: "TEPM Study | Plataforma de estudos terapeuticos com IA",
  description: "Organize PDFs, videos, revisoes, trilhas e memoria inteligente em uma plataforma privada de estudos terapeuticos com IA mentora.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TEPM Study",
    description: "Estudos terapeuticos com IA, memoria inteligente, trilhas e revisoes.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TEPM Study",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "Plataforma privada de estudos terapeuticos com IA, memoria inteligente, trilhas, revisoes e mentora RAG.",
    offers: plans.map((plan) => ({ "@type": "Offer", name: plan.name, description: plan.description })),
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LgpdConsentBanner />
      <section className="relative px-5 py-8 md:px-10 lg:px-16">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="font-serif text-2xl font-bold text-[#32162c]">TEPM Study</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          </div>
        </nav>
        <div className="mx-auto grid max-w-7xl items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.04] text-[#2b1428] md:text-7xl">
              TEPM Study
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#604758]">
              Transforme PDFs terapeuticos em resumos, memoria inteligente, trilhas de estudo e respostas com fontes.
              Menos busca manual, mais clareza para estudar, revisar e aplicar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <ShinyButton className="bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(47,125,104,0.22)]">
                  Login <ArrowRight className="inline h-4 w-4" />
                </ShinyButton>
              </Link>
              <Link href="/login?teste=1">
                <Button size="lg" variant="outline">
                  Teste
                </Button>
              </Link>
            </div>
          </div>
          <div className="premium-glow rounded-[28px] border border-white/80 bg-[#14352f] p-4 shadow-2xl sm:p-5">
            <div className="rounded-[22px] bg-[#f3fbf6] p-4 sm:p-5">
              <div className="grid gap-4">
                {features.map((feature) => (
                  <Card key={feature.title} className="bg-white">
                    <CardHeader className="flex flex-row items-start gap-3 p-4 sm:p-5">
                      <feature.icon className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-6 pb-16 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Dores que o TEPM resolve</CardTitle>
              <CardDescription>Organizacao e revisao para quem estuda muito e precisa aplicar melhor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {pains.map((pain) => (
                <p key={pain} className="rounded-[14px] bg-[#eef8f2] p-3">{pain}</p>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Planos</CardTitle>
              <CardDescription>Licencas por perfil, limites de uso e comunidade premium.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-[16px] border bg-white p-4">
                  <h3 className="font-serif text-xl font-bold text-[#183c35]">{plan.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  <a
                    className={[
                      "mt-4 inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-[14px] px-3 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-auto",
                      plan.name === "Premium"
                        ? "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(47,125,104,0.22)] hover:bg-[#256553] hover:shadow-[0_16px_42px_rgba(47,125,104,0.34)]"
                        : "border border-border bg-white/74 text-foreground shadow-[0_10px_26px_rgba(199,166,75,0.11)] hover:border-[#c7a64b] hover:bg-white hover:shadow-[0_14px_36px_rgba(199,166,75,0.2)]",
                    ].join(" ")}
                    href={`https://wa.me/5571999589626?text=${encodeURIComponent(plan.message)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <footer className="mx-auto flex max-w-7xl flex-wrap gap-3 pb-8 text-sm text-muted-foreground">
          <Link href="/termos" className="hover:text-[#14352f]">Termos de uso</Link>
          <Link href="/privacidade" className="hover:text-[#14352f]">Politica de privacidade</Link>
        </footer>
      </section>
    </main>
  );
}

