import Link from "next/link";
import { ArrowRight, Brain, FileText, Lock, Users } from "lucide-react";
import { LeadCaptureForm } from "@/components/growth/lead-capture-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  { name: "Free", description: "Entrada limitada para conhecer a plataforma.", cta: "Criar conta" },
  { name: "Estudante", description: "PDFs, caderno e chat IA para rotina individual.", cta: "Solicitar acesso" },
  { name: "Premium", description: "Trilhas, mapas mentais e comunidade privada.", cta: "Solicitar acesso" },
  { name: "Profissional", description: "Licencas, grupos, auditoria e painel admin.", cta: "Falar com admin" },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TEPM Study Core",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "Plataforma privada de estudos terapeuticos com IA, memoria inteligente, trilhas, revisoes e mentora RAG.",
    offers: plans.map((plan) => ({ "@type": "Offer", name: plan.name, description: plan.description })),
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative px-5 py-8 md:px-10 lg:px-16">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="font-serif text-2xl font-bold text-[#32162c]">TEPM Study Core</p>
          </div>
          <Link href="/login">
            <Button size="sm">Entrar</Button>
          </Link>
        </nav>
        <div className="mx-auto grid max-w-7xl items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.04] text-[#2b1428] md:text-7xl">
              TEPM Study Core
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#604758]">
              Transforme PDFs terapeuticos em resumos, memoria inteligente, trilhas de estudo e respostas com fontes.
              Menos busca manual, mais clareza para estudar, revisar e aplicar.
            </p>
            <LeadCaptureForm />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg">
                  Acessar plataforma <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button size="lg" variant="outline">
                  Solicitar convite
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-[#14352f] p-5 shadow-2xl shadow-[#2f7d68]/20">
            <div className="rounded-[22px] bg-[#f3fbf6] p-5">
              <div className="grid gap-4">
                {features.map((feature) => (
                  <Card key={feature.title} className="bg-white">
                    <CardHeader className="flex flex-row items-start gap-3">
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
              <CardTitle>Planos e monetizacao</CardTitle>
              <CardDescription>Licencas por perfil, limites de uso e comunidade premium.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-[16px] border bg-white p-4">
                  <h3 className="font-serif text-xl font-bold text-[#183c35]">{plan.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  <Link href="/cadastro" className="mt-4 inline-flex">
                    <Button size="sm" variant={plan.name === "Premium" ? "primary" : "outline"}>{plan.cta}</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

