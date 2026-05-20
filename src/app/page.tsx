import Link from "next/link";
import { ArrowRight, Brain, FileText, Lock, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "Biblioteca inteligente", description: "PDFs, textos, resumos e arquivos com processamento seguro por usuario.", icon: FileText },
  { title: "Mentora IA com RAG", description: "Gemini e OpenRouter respondem com base no material autorizado.", icon: Brain },
  { title: "Licencas e comunidade", description: "Planos, validade, salas privadas e permissao por membro.", icon: Users },
  { title: "LGPD por design", description: "RLS, isolamento por user_id, consentimento de upload e logs de acesso.", icon: Lock },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative px-5 py-8 md:px-10 lg:px-16">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="font-serif text-2xl font-bold text-[#32162c]">TEPM Study Core</p>
            <p className="text-xs uppercase tracking-[0.26em] text-[#916f1e]">Ontec Systems</p>
          </div>
          <Link href="/login">
            <Button size="sm">Entrar</Button>
          </Link>
        </nav>
        <div className="mx-auto grid max-w-7xl items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7cfc9] bg-white/70 px-4 py-2 text-sm font-semibold text-[#6e2341]">
              <Sparkles className="h-4 w-4 text-[#bd9b38]" />
              Plataforma privada de estudos terapeuticos com IA
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.04] text-[#2b1428] md:text-7xl">
              TEPM Study Core
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#604758]">
              Organize materiais, extraia conhecimento de PDFs e videos, crie trilhas, converse com uma mentora IA e
              mantenha dados protegidos por licenca, RLS e controle de acesso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg">
                  Comecar com acesso seguro <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Ver dashboard
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-[#211326] p-5 shadow-2xl shadow-[#6f3150]/20">
            <div className="rounded-[22px] bg-[#fff8f3] p-5">
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
      </section>
    </main>
  );
}
