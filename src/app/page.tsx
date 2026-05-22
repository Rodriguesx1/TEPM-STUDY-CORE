import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, Brain, CheckCircle2, FileText, Lock, MessageCircle, Sparkles } from "lucide-react";
import { LgpdConsentBanner } from "@/components/privacy/lgpd-consent-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { ActionCluster, AmbientNileBackground, CalmGrid, LuxuryBadge, PremiumCard, SectionShell, SoftPanel } from "@/components/ui/premium";

const whatsapp = "5571999589626";

const features = [
  { title: "Biblioteca inteligente", description: "PDFs, resumos e aulas deixam de ficar espalhados e viram uma memoria pesquisavel.", icon: FileText },
  { title: "Mentora IA com fontes", description: "A IA responde com base nos seus materiais processados e indica de onde veio o contexto.", icon: Brain },
  { title: "Trilhas e revisoes", description: "O estudo ganha ordem, prioridade e revisao com direcao, sem sobrecarregar sua rotina.", icon: BookOpenCheck },
  { title: "Ambiente privado", description: "Uso pessoal ou organizacional com controle de acesso, licencas, logs e LGPD.", icon: Lock },
];

const pains = [
  "PDFs e aulas acumulados sem um caminho claro",
  "Dificuldade para revisar e lembrar pontos importantes",
  "Tempo perdido procurando scripts, resumos e temas",
  "Ansiedade cognitiva por excesso de conteudo solto",
];

const steps = [
  "Envie seus PDFs e materiais autorizados.",
  "A plataforma extrai, resume e organiza por tema.",
  "A Mentora IA responde com base na sua memoria de estudos.",
  "Voce transforma conteudo em trilhas, mapas e revisoes.",
];

const plans = [
  { name: "Free", description: "Entrada limitada para conhecer o ambiente.", highlight: false, message: "Ola, quero conhecer o plano Free do TEPM Study." },
  { name: "Estudante", description: "PDFs, caderno e chat IA para rotina individual.", highlight: false, message: "Ola, quero informacoes sobre o plano Estudante do TEPM Study." },
  { name: "Premium", description: "Trilhas, mapas mentais, revisoes e comunidade privada.", highlight: true, message: "Ola, quero informacoes sobre o plano Premium do TEPM Study." },
  { name: "Profissional", description: "Licencas, grupos, auditoria e painel administrativo.", highlight: false, message: "Ola, quero informacoes sobre o plano Profissional do TEPM Study." },
];

const faqs = [
  ["Isso substitui um curso?", "Nao. O TEPM Study organiza seus materiais autorizados e apoia estudo, revisao e aplicacao."],
  ["Meus arquivos ficam seguros?", "A proposta e manter dados privados, isolados por usuario e protegidos por autenticacao e permissoes."],
  ["A IA inventa respostas?", "O modo RAG prioriza responder a partir dos materiais enviados. Quando nao encontra base, deve sinalizar a ausencia de contexto."],
  ["Posso usar para estudo pessoal?", "Sim. O foco e estudo privado, organizacao terapeutica e produtividade cognitiva."],
];

export const metadata: Metadata = {
  title: "TEPM Study | Ambiente cognitivo terapeutico com IA",
  description: "Organize PDFs terapeuticos, crie memoria pesquisavel, converse com IA com fontes e siga trilhas de revisao com direcao.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TEPM Study",
    description: "Ambiente privado de estudos terapeuticos com IA, memoria inteligente, revisoes e mapas mentais.",
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
    description: "Ambiente privado de estudos terapeuticos com IA, memoria pesquisavel, trilhas e revisoes.",
    offers: plans.map((plan) => ({ "@type": "Offer", name: plan.name, description: plan.description })),
  };

  return (
    <AmbientNileBackground>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LgpdConsentBanner />
      <main className="overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-[#6fae9b]/14 bg-[#071412]/70 backdrop-blur-2xl">
          <SectionShell className="flex items-center justify-between py-4">
            <Link href="/" className="font-serif text-3xl font-semibold leading-none text-[#f3eee8]">
              TEPM Study
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            </div>
          </SectionShell>
        </header>

        <SectionShell className="grid items-center gap-8 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="calm-enter">
            <LuxuryBadge>Ambiente privado de estudos terapeuticos</LuxuryBadge>
            <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[0.92] text-[#f3eee8] sm:text-7xl lg:text-8xl">
              Menos ruido. Mais clareza para estudar e aplicar.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-9 text-[#d8cec2]">
              Organize PDFs, videos e anotacoes em uma memoria inteligente. Converse com uma mentora IA com fontes,
              gere trilhas, mapas mentais e revisoes com direcao.
            </p>
            <ActionCluster className="mt-9">
              <Link href="/login">
                <Button size="lg">
                  Entrar no ambiente <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login?teste=1">
                <Button size="lg" variant="outline">
                  Acessar teste
                </Button>
              </Link>
            </ActionCluster>
          </div>

          <PremiumCard className="relative overflow-hidden p-5 sm:p-6">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#6fae9b]/14 blur-3xl" />
            <div className="relative space-y-4">
              {features.map((feature) => (
                <SoftPanel key={feature.title} className="flex gap-4 p-4">
                  <feature.icon className="mt-1 h-5 w-5 shrink-0 text-[#6fae9b]" />
                  <div>
                    <h2 className="font-serif text-2xl text-[#f3eee8]">{feature.title}</h2>
                    <p className="mt-1 text-sm leading-7 text-[#cbbfb1]">{feature.description}</p>
                  </div>
                </SoftPanel>
              ))}
            </div>
          </PremiumCard>
        </SectionShell>

        <SectionShell className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <PremiumCard>
            <LuxuryBadge>Dor real</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl text-[#f3eee8]">O excesso de conteudo nao precisa virar ansiedade.</h2>
            <div className="mt-6 space-y-3">
              {pains.map((pain) => (
                <SoftPanel key={pain} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#6fae9b]" />
                  <p className="text-sm leading-7 text-[#f2eadf]">{pain}</p>
                </SoftPanel>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard>
            <LuxuryBadge>Como funciona</LuxuryBadge>
            <CalmGrid className="mt-5 md:grid-cols-2">
              {steps.map((step, index) => (
                <SoftPanel key={step}>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b79a6b]">0{index + 1}</span>
                  <p className="mt-3 text-sm leading-7 text-[#f2eadf]">{step}</p>
                </SoftPanel>
              ))}
            </CalmGrid>
          </PremiumCard>
        </SectionShell>

        <SectionShell>
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <LuxuryBadge>Planos</LuxuryBadge>
              <h2 className="mt-4 font-serif text-5xl leading-none text-[#f3eee8]">Escolha seu nivel de direcao.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#cbbfb1]">Planos para estudo pessoal, rotina premium e organizacoes que precisam de controle.</p>
          </div>
          <CalmGrid className="md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PremiumCard key={plan.name} className={plan.highlight ? "border-[#b79a6b]/55 bg-[#123a34]/82" : ""}>
                {plan.highlight ? <LuxuryBadge>Mais completo</LuxuryBadge> : null}
                <h3 className="mt-3 font-serif text-4xl text-[#f3eee8]">{plan.name}</h3>
                <p className="mt-3 min-h-20 text-sm leading-7 text-[#cbbfb1]">{plan.description}</p>
                <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(plan.message)}`} target="_blank" rel="noreferrer">
                  <Button className="mt-5 w-full" variant={plan.highlight ? "primary" : "outline"}>
                    Acessar plano
                  </Button>
                </a>
              </PremiumCard>
            ))}
          </CalmGrid>
        </SectionShell>

        <SectionShell className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <PremiumCard>
            <Sparkles className="h-6 w-6 text-[#b79a6b]" />
            <h2 className="mt-4 font-serif text-4xl text-[#f3eee8]">Pronto para transformar material acumulado em direcao?</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">Comece pelo primeiro PDF. A plataforma organiza o conteudo para voce estudar com menos busca manual e mais continuidade.</p>
            <Link href="/login">
              <Button className="mt-6">Entrar agora</Button>
            </Link>
          </PremiumCard>
          <CalmGrid className="md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <SoftPanel key={question}>
                <h3 className="font-serif text-2xl text-[#f3eee8]">{question}</h3>
                <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{answer}</p>
              </SoftPanel>
            ))}
          </CalmGrid>
        </SectionShell>

        <footer className="border-t border-[#6fae9b]/14">
          <SectionShell className="flex flex-col gap-3 py-8 text-sm text-[#cbbfb1] sm:flex-row sm:items-center sm:justify-between">
            <p>TEPM Study. Estudo privado, memoria inteligente e organizacao terapeutica.</p>
            <div className="flex gap-4">
              <Link href="/termos" className="hover:text-[#f2eadf]">Termos</Link>
              <Link href="/privacidade" className="hover:text-[#f2eadf]">Privacidade</Link>
              <Link href="/login" className="hover:text-[#f2eadf]"><MessageCircle className="mr-1 inline h-4 w-4" />Entrar</Link>
            </div>
          </SectionShell>
        </footer>
      </main>
    </AmbientNileBackground>
  );
}
