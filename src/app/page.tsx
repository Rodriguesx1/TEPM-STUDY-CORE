import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  Brain,
  CalendarDays,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Layers3,
  Lock,
  Map,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Waves,
} from "lucide-react";
import { LgpdConsentBanner } from "@/components/privacy/lgpd-consent-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { ActionCluster, AmbientNileBackground, CalmGrid, LuxuryBadge, PremiumCard, SectionShell, SoftPanel } from "@/components/ui/premium";

const whatsapp = "5571999589626";

const painPoints = [
  "PDFs, aulas e resumos espalhados sem uma linha de continuidade.",
  "Dificuldade para revisar exatamente o que importa depois de estudar.",
  "Excesso de informação terapêutica gerando sobrecarga mental.",
  "Tempo perdido procurando scripts, temas, trechos e materiais antigos.",
  "Conteúdo acumulado que não vira aplicação prática na rotina.",
  "Falta de direção emocional e cognitiva para manter constância.",
];

const capabilities = [
  {
    title: "Biblioteca inteligente",
    pain: "Resolve PDFs e materiais soltos.",
    transformation: "Cada arquivo autorizado vira resumo, categoria, chunks e memória pesquisável.",
    icon: FileText,
  },
  {
    title: "Mentora IA com RAG",
    pain: "Resolve perguntas sem contexto.",
    transformation: "A IA responde com base nos seus materiais e sinaliza quando não encontra base.",
    icon: Brain,
  },
  {
    title: "Trilhas automaticas",
    pain: "Resolve falta de ordem para estudar.",
    transformation: "Os temas viram prioridades, módulos, revisões e próximas ações.",
    icon: BookOpenCheck,
  },
  {
    title: "Revisão inteligente",
    pain: "Resolve esquecimento e abandono.",
    transformation: "A plataforma sugere retomadas, lacunas e foco semanal com menos ruido.",
    icon: CalendarDays,
  },
  {
    title: "Diário emocional privado",
    pain: "Resolve perda de percepcao pessoal.",
    transformation: "Reflexões ficam protegidas e so entram na IA se voce permitir.",
    icon: NotebookPen,
  },
  {
    title: "Calendário cognitivo opcional",
    pain: "Resolve rotina igual para dias diferentes.",
    transformation: "Ciclo, energia e humor podem adaptar estudos sem prometer diagnostico.",
    icon: Waves,
  },
  {
    title: "Mapas mentais e slides",
    pain: "Resolve conteúdo difícil de visualizar.",
    transformation: "Materiais viram estruturas navegáveis, apresentações e apoio didático.",
    icon: Map,
  },
  {
    title: "Comunidade privada",
    pain: "Resolve estudo isolado sem controle.",
    transformation: "Salas por permissão mantém grupos protegidos e organizados.",
    icon: Users,
  },
];

const workflow = [
  { title: "Envie seus materiais", body: "PDFs, vídeos, textos e anotações autorizadas entram em uma biblioteca privada.", icon: UploadCloud },
  { title: "A IA processa com cuidado", body: "O conteúdo é extraído, resumido, classificado e dividido em memória pesquisável.", icon: Layers3 },
  { title: "A memória organiza contexto", body: "Chunks, categorias e busca semântica reduzem a procura manual por informação.", icon: Sparkles },
  { title: "A Mentora responde com fontes", body: "As respostas priorizam seus materiais e mostram a base usada quando houver contexto.", icon: Brain },
  { title: "Trilhas criam direção", body: "O sistema transforma excesso de conteúdo em plano, revisão e continuidade.", icon: BookOpenCheck },
  { title: "Você revisa e evolui", body: "Diário, foco, calendário e notifica??es mantém uma rotina mais leve e consistente.", icon: HeartHandshake },
];

const plans = [
  {
    name: "Free",
    promise: "Explore a organização terapêutica inteligente.",
    features: ["Entrada para conhecer o ambiente", "Primeiros fluxos de estudo", "Visão da biblioteca e privacidade"],
    cta: "Comecar gratuitamente",
    message: "Olá, quero comecar gratuitamente no TEPM Study.",
  },
  {
    name: "Estudante",
    promise: "Estudo privado com IA e continuidade.",
    features: ["PDFs e caderno individual", "Chat IA com materiais", "Revisoes e trilhas pessoais"],
    cta: "Entrar no Estudante",
    message: "Olá, quero informações sobre o plano Estudante do TEPM Study.",
  },
  {
    name: "Premium",
    promise: "Trilhas, revisões, mapas mentais e rotina inteligente.",
    features: ["Mapas mentais e slides", "Diário emocional opt-in", "Calendário cognitivo opcional", "Comunidade premium"],
    cta: "Entrar no Premium",
    message: "Olá, quero entrar no plano Premium do TEPM Study.",
    highlight: true,
  },
  {
    name: "Profissional",
    promise: "Ecossistema completo para evolução terapêutica.",
    features: ["Licenças e grupos", "Painel administrativo", "Auditoria, logs e permissão", "Rotina profissional completa"],
    cta: "Ativar ambiente profissional",
    message: "Olá, quero ativar o ambiente profissional do TEPM Study.",
  },
];

const faqs = [
  ["A IA inventa respostas?", "O modo RAG prioriza os materiais processados. Quando não encontra base, deve informar que não há contexto suficiente."],
  ["Meus arquivos ficam privados?", "Sim. O projeto usa autenticação, isolamento por usuário, RLS e storage privado para materiais autorizados."],
  ["Isso substitui terapia?", "Não. O TEPM Study apoia estudo, organização e reflexão. Não diagnostica, não prescreve e não substitui profissionais."],
  ["Posso usar só para estudos?", "Sim. A plataforma foi pensada para estudo privado, revisão, memória e organização terapêutica."],
  ["O calendário cíclico é obrigatório?", "Não. Recursos cíclicos e diário emocional são opcionais e exigem consentimento sensível separado."],
  ["Meus dados ficam seguros?", "Há consentimento, exportação, exclusão, logs minimizados e controle de permissão. Dados sensíveis são opt-in."],
  ["Posso apagar tudo?", "Sim. O centro de privacidade permite exportar e solicitar exclusão de dados gerais e sensíveis."],
  ["Preciso entender tecnologia?", "Não. O fluxo foi desenhado para enviar, organizar, perguntar, revisar e continuar sem termos técnicos no caminho."],
];

export const metadata: Metadata = {
  title: "TEPM Study | Memória inteligente para estudos terapêuticos com IA",
  description:
    "Transforme PDFs, aulas e anotações terapêuticas em biblioteca inteligente, mentora IA com fontes, trilhas, revisões, diário privado e rotina cognitiva leve.",
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
  alternates: { canonical: "/" },
  openGraph: {
    title: "TEPM Study | Ambiente cognitivo terapêutico com IA",
    description: "PDFs viram memória inteligente. A IA responde com fontes, cria trilhas e apoia continuidade emocional e cognitiva com privacidade.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study",
    description: "Ambiente privado para organizar estudos terapêuticos com IA, memória inteligente e revisão guiada.",
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
    offers: plans.map((plan) => ({ "@type": "Offer", name: plan.name, description: plan.promise })),
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <AmbientNileBackground>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([softwareSchema, faqSchema]) }} />
      <LgpdConsentBanner />
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
              Transforme materiais terapêuticos em memória inteligente.
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

        <SectionShell id="dores" className="py-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <LuxuryBadge>Menos caos cognitivo</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Seu conteúdo terapêutico não deveria parecer um caos.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">A plataforma foi criada para quem estuda muito, acumula materiais importantes e precisa transformar excesso em direção.</p>
          </div>
          <CalmGrid className="mt-8 md:grid-cols-2 xl:grid-cols-3">
            {painPoints.map((pain) => (
              <SoftPanel key={pain} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#6fae9b]" />
                <p className="text-sm leading-7 text-[#f2eadf]">{pain}</p>
              </SoftPanel>
            ))}
          </CalmGrid>
        </SectionShell>

        <SectionShell id="recursos" className="py-10 sm:py-14">
          <div className="mb-8 max-w-3xl">
            <LuxuryBadge>Sistema operacional terapêutico</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">O que a plataforma faz por voce.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">Cada modulo existe para reduzir busca manual, preservar contexto e manter continuidade de estudo.</p>
          </div>
          <CalmGrid className="md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item) => (
              <PremiumCard key={item.title} className="p-5">
                <item.icon className="h-6 w-6 text-[#6fae9b]" />
                <h3 className="mt-4 font-serif text-3xl text-[#f3eee8]">{item.title}</h3>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#b79a6b]">{item.pain}</p>
                <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">{item.transformation}</p>
              </PremiumCard>
            ))}
          </CalmGrid>
        </SectionShell>

        <SectionShell id="como-funciona" className="py-10 sm:py-14">
          <PremiumCard className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <LuxuryBadge>Fluxo simples</LuxuryBadge>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Como seus materiais viram continuidade.</h2>
                <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">Sem termos técnicos no caminho: envie, processe, pergunte, revise e aplique.</p>
              </div>
              <CalmGrid className="md:grid-cols-2">
                {workflow.map((step, index) => (
                  <SoftPanel key={step.title}>
                    <div className="flex items-start gap-3">
                      <step.icon className="mt-1 h-5 w-5 shrink-0 text-[#6fae9b]" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b79a6b]">0{index + 1}</span>
                        <h3 className="mt-2 font-serif text-2xl text-[#f3eee8]">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{step.body}</p>
                      </div>
                    </div>
                  </SoftPanel>
                ))}
              </CalmGrid>
            </div>
          </PremiumCard>
        </SectionShell>

        <SectionShell id="mentora" className="grid gap-6 py-10 sm:py-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <LuxuryBadge>Mentora IA</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Uma IA que responde com contexto, não com improviso.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">
              A Mentora IA foi pensada para estudos terapêuticos: organiza respostas por tópicos, sugere revisões, aponta lacunas e diferencia material enviado de orientação geral.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#f2eadf]">
              {["Responde com base nos seus PDFs e transcrições.", "Mostra fontes usadas quando há contexto.", "Evita inventar quando o conteúdo não foi encontrado.", "Sugere próximos estudos e perguntas de fixação."].map((item) => (
                <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#6fae9b]" />{item}</li>
              ))}
            </ul>
          </div>
          <PremiumCard className="p-5">
            <SoftPanel>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b79a6b]">Pergunta</p>
              <p className="mt-3 text-sm leading-7 text-[#f2eadf]">Com base nos meus PDFs, como revisar ciclo menstrual sem perder continuidade?</p>
            </SoftPanel>
            <SoftPanel className="mt-4 bg-[#071412]/40">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6fae9b]">Mentora IA</p>
              <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">
                Encontrei base em 2 materiais. Comece pela fisiologia do ciclo, depois revise hormônios e comportamentos. Sugiro uma sessão de 20 minutos e 3 perguntas de fixação.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#f2eadf]">
                <span className="rounded-full border border-[#6fae9b]/20 px-3 py-1">Fonte: PDF processado</span>
                <span className="rounded-full border border-[#6fae9b]/20 px-3 py-1">Modo RAG</span>
              </div>
            </SoftPanel>
          </PremiumCard>
        </SectionShell>

        <SectionShell id="continuidade" className="py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <PremiumCard>
              <LuxuryBadge>Continuidade emocional e cognitiva</LuxuryBadge>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Estudar tambem precisa respeitar ritmo.</h2>
              <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">
                Diário privado, modo acolhimento, foco e calendário cognitivo/cíclico opcional ajudam a manter constância sem transformar estudo em pressão.
              </p>
              <p className="mt-4 rounded-[18px] border border-[#b79a6b]/20 bg-[#b79a6b]/8 p-4 text-sm leading-7 text-[#f2eadf]">
                As previsões cíclicas são estimativas baseadas nos dados informados e não substituem orientação médica.
              </p>
            </PremiumCard>
            <CalmGrid className="md:grid-cols-2">
              {[
                { title: "Modo acolhimento", body: "Retomada leve com respiração, diário rápido e revisão suave.", icon: HeartHandshake },
                { title: "Modo foco", body: "Cronometro limpo, tarefa unica e fechamento de estudo.", icon: Sparkles },
                { title: "Diário privado", body: "Texto sensível fica fora da IA até você permitir explicitamente.", icon: NotebookPen },
                { title: "Notificações discretas", body: "Lembretes internos, horário silencioso e sons opcionais.", icon: Bell },
              ].map((item) => (
                <SoftPanel key={item.title}>
                  <item.icon className="h-5 w-5 text-[#6fae9b]" />
                  <h3 className="mt-3 font-serif text-2xl text-[#f3eee8]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{item.body}</p>
                </SoftPanel>
              ))}
            </CalmGrid>
          </div>
        </SectionShell>

        <SectionShell id="privacidade" className="py-10 sm:py-14">
          <PremiumCard className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <ShieldCheck className="h-7 w-7 text-[#6fae9b]" />
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Privacidade não é detalhe. É estrutura.</h2>
              <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">O TEPM Study foi desenhado para estudo privado, consentimento e controle do usuário.</p>
            </div>
            <CalmGrid className="md:grid-cols-2">
              {["LGPD e consentimentos", "Dados sensíveis opt-in", "Exporta??o e exclusão", "Controle de acesso e RLS", "Storage privado", "IA sem chaves no front-end"].map((item) => (
                <SoftPanel key={item} className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-[#b79a6b]" />
                  <p className="text-sm font-semibold text-[#f2eadf]">{item}</p>
                </SoftPanel>
              ))}
            </CalmGrid>
          </PremiumCard>
        </SectionShell>

        <SectionShell id="planos" className="py-10 sm:py-14">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <LuxuryBadge>Planos</LuxuryBadge>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Escolha o nivel do seu ambiente.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#cbbfb1]">Planos claros para conhecer, estudar, evoluir e organizar rotinas terapêuticas com mais profundidade.</p>
          </div>
          <CalmGrid className="md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PremiumCard key={plan.name} className={plan.highlight ? "border-[#b79a6b]/55 bg-[#123a34]/82" : ""}>
                {plan.highlight ? <LuxuryBadge>Mais escolhido</LuxuryBadge> : null}
                <h3 className="mt-3 font-serif text-4xl text-[#f3eee8]">{plan.name}</h3>
                <p className="mt-3 min-h-16 text-sm leading-7 text-[#cbbfb1]">{plan.promise}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[#f2eadf]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#6fae9b]" />{feature}</li>
                  ))}
                </ul>
                <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(plan.message)}`} target="_blank" rel="noreferrer">
                  <Button className="mt-6 w-full" variant={plan.highlight ? "primary" : "outline"}>
                    {plan.cta}
                  </Button>
                </a>
              </PremiumCard>
            ))}
          </CalmGrid>
        </SectionShell>

        <SectionShell id="faq" className="grid gap-6 py-10 sm:py-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <LuxuryBadge>FAQ</LuxuryBadge>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Perguntas antes de entrar.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">Respostas diretas para reduzir dúvida, insegurança técnica e preocupações de privacidade.</p>
          </div>
          <CalmGrid className="md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <SoftPanel key={question}>
                <h3 className="font-serif text-2xl text-[#f3eee8]">{question}</h3>
                <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">{answer}</p>
              </SoftPanel>
            ))}
          </CalmGrid>
        </SectionShell>

        <SectionShell className="py-10 sm:py-16">
          <PremiumCard className="relative overflow-hidden p-6 text-center sm:p-10">
            <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-[#6fae9b]/12 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <LuxuryBadge>Continuidade real</LuxuryBadge>
              <h2 className="mt-5 font-serif text-4xl leading-tight text-[#f3eee8] sm:text-6xl">Transforme seus materiais em uma rotina que continua.</h2>
              <p className="mt-4 text-sm leading-7 text-[#cbbfb1]">Pare de acumular conteúdo sem direção. Crie um ambiente privado para estudar, revisar, perguntar e aplicar com mais clareza.</p>
              <ActionCluster className="mt-7 justify-center">
                <Link href="/login">
                  <Button size="lg">Entrar no TEPM Study</Button>
                </Link>
                <Link href="/login?next=/biblioteca">
                  <Button size="lg" variant="outline">Comecar minha biblioteca inteligente</Button>
                </Link>
              </ActionCluster>
            </div>
          </PremiumCard>
        </SectionShell>

        <footer className="border-t border-[#6fae9b]/14">
          <SectionShell className="flex flex-col gap-3 py-8 text-sm text-[#cbbfb1] sm:flex-row sm:items-center sm:justify-between">
            <p>TEPM Study. Ambiente cognitivo terapêutico, privado e inteligente.</p>
            <div className="flex flex-wrap gap-4">
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
