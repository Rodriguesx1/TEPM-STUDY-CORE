import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Brain, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LandingDeferredLoader } from "@/components/landing/landing-deferred-loader";
import { Button } from "@/components/ui/button";
import { ActionCluster, AmbientNileBackground, LuxuryBadge, PremiumCard, SectionShell, SoftPanel } from "@/components/ui/premium";

export const metadata: Metadata = {
  title: "TEPM Study | Estudos terapêuticos com IA e memória",
  description:
    "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
  keywords: [
    "estudos terapêuticos",
    "IA para estudos",
    "organização de PDFs",
    "revisão inteligente",
    "memória inteligente",
    "IA terapêutica",
    "biblioteca inteligente",
    "estudos femininos",
    "produtividade terapêutica",
    "plataforma terapêutica",
  ],
  alternates: { canonical: "https://tepmstudy.vercel.app/" },
  openGraph: {
    title: "TEPM Study | Estudos terapêuticos com IA e memória",
    description: "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
    url: "https://tepmstudy.vercel.app/",
    siteName: "TEPM Study",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://tepmstudy.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "TEPM Study: estudos terapêuticos com IA e memória inteligente.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study | Estudos terapêuticos com IA e memória",
    description: "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
    images: [
      {
        url: "https://tepmstudy.vercel.app/og-image.png",
        alt: "TEPM Study: estudos terapêuticos com IA e memória inteligente.",
      },
    ],
  },
};

export default function HomePage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TEPM Study",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "Ambiente cognitivo terapêutico premium com IA, biblioteca inteligente, RAG, trilhas, diário privado e revisões.",
    offers: ["Free", "Estudante", "Premium", "Profissional"].map((name) => ({ "@type": "Offer", name })),
  };
  return (
    <AmbientNileBackground>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <main className="overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-[#6fae9b]/14 bg-[#071412]/76 backdrop-blur-2xl">
          <SectionShell className="flex items-center justify-between py-3 sm:py-4">
            <Link href="/" className="font-serif text-2xl font-semibold leading-none text-[#f3eee8] sm:text-3xl" aria-label="TEPM Study pagina inicial">
              TEPM Study
            </Link>
            <nav className="flex items-center gap-2" aria-label="Navegacao principal">
              <Link href="#como-funciona" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[#cbbfb1] transition hover:text-[#f3eee8] md:inline-flex">
                Como funciona
              </Link>
              <Link href="#planos" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[#cbbfb1] transition hover:text-[#f3eee8] md:inline-flex">
                Planos
              </Link>
              <ThemeToggle />
              <Link href="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            </nav>
          </SectionShell>
        </header>

        <SectionShell className="grid min-h-[calc(100dvh-5rem)] items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.03fr_0.97fr] lg:py-18">
          <section className="calm-enter">
            <LuxuryBadge>Ecossistema feminino privado com IA</LuxuryBadge>
            <h1 className="mt-6 max-w-5xl font-serif text-5xl leading-[0.94] text-[#f3eee8] sm:text-7xl lg:text-8xl">
              
              Estudos terapêuticos com IA para organizar sua rotina
            
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#d8cec2] sm:text-lg">
              O TEPM Study organiza PDFs, vídeos, resumos e anotações em uma biblioteca inteligente. A Mentora IA responde com fontes, cria trilhas, sugere revisões e apoia continuidade emocional com diário privado e calendário opcional.
            </p>
            <ActionCluster className="mt-8">
              <Link href="/login">
                <Button size="lg">
                  Comecar meu ambiente privado <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline">
                  Ver como funciona
                </Button>
              </Link>
            </ActionCluster>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#cbbfb1]">
              {["PDFs viram memória", "IA com fontes", "Diário opt-in", "LGPD-first"].map((item) => (
                <span key={item} className="rounded-full border border-[#6fae9b]/18 bg-[#0d2b26]/60 px-3 py-2">{item}</span>
              ))}
            </div>
          </section>

          <PremiumCard className="relative overflow-hidden p-4 sm:p-6">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#6fae9b]/16 blur-3xl" />
            <div className="absolute -bottom-20 left-6 h-44 w-44 rounded-full bg-[#b79a6b]/10 blur-3xl" />
            <div className="relative space-y-4">
              <SoftPanel>
                <div className="flex items-start gap-4">
                  <FileText className="mt-1 h-5 w-5 shrink-0 text-[#6fae9b]" />
                  <div>
                    <h2 className="font-serif text-2xl text-[#f3eee8]">Biblioteca que entende seu conteúdo</h2>
                    <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">PDFs deixam de ser arquivos parados e viram temas, resumos, chunks e busca semântica.</p>
                  </div>
                </div>
              </SoftPanel>
              <SoftPanel className="ml-0 sm:ml-8">
                <div className="flex items-start gap-4">
                  <Brain className="mt-1 h-5 w-5 shrink-0 text-[#6fae9b]" />
                  <div>
                    <h2 className="font-serif text-2xl text-[#f3eee8]">Mentora IA contextual</h2>
                    <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">Pergunte com calma. A IA usa sua memória autorizada e mostra as fontes quando houver base.</p>
                  </div>
                </div>
              </SoftPanel>
              <SoftPanel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Trilhas", "Revisoes", "Foco"].map((item) => (
                    <div key={item} className="rounded-[18px] border border-[#6fae9b]/14 bg-[#071412]/35 p-3">
                      <p className="font-serif text-xl text-[#f3eee8]">{item}</p>
                      <p className="mt-1 text-xs leading-5 text-[#cbbfb1]">continuidade real</p>
                    </div>
                  ))}
                </div>
              </SoftPanel>
            </div>
          </PremiumCard>
        </SectionShell>

        <LandingDeferredLoader />
      </main>
    </AmbientNileBackground>
  );
}
