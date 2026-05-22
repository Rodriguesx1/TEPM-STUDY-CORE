import Link from "next/link";
import type { Metadata } from "next";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { AmbientNileBackground, LuxuryBadge, SoftPanel } from "@/components/ui/premium";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <AmbientNileBackground>
      <main className="grid min-h-dvh items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <section className="mx-auto max-w-2xl calm-enter">
          <Link href="/" className="font-serif text-3xl font-semibold text-[#f3eee8]">
            TEPM Study
          </Link>
          <LuxuryBadge className="mt-10">Portal privado</LuxuryBadge>
          <h1 className="mt-6 font-serif text-5xl leading-[0.98] text-[#f3eee8] sm:text-6xl">
            Entre no seu ambiente privado de estudos.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#d8cec2]">
            Seus materiais, trilhas, revisões e conversas com IA protegidos em um só lugar, com uma experiência calma e organizada.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Acesso protegido" },
              { icon: LockKeyhole, label: "Dados privados" },
              { icon: Sparkles, label: "IA com contexto" },
            ].map((item) => (
              <SoftPanel key={item.label} className="p-4">
                <item.icon className="h-5 w-5 text-[#6fae9b]" />
                <p className="mt-3 text-sm font-semibold leading-6 text-[#f2eadf]">{item.label}</p>
              </SoftPanel>
            ))}
          </div>
        </section>
        <section className="mx-auto w-full max-w-md">
          <AuthForm />
        </section>
      </main>
    </AmbientNileBackground>
  );
}
