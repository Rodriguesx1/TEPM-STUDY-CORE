import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen items-center px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="mx-auto max-w-2xl">
        <Link href="/" className="font-serif text-2xl font-bold text-[#32162c]">
          TEPM Study Core
        </Link>
        <h1 className="mt-8 font-serif text-5xl font-bold leading-tight text-[#2b1428]">
          Acesso privado para estudos terapeuticos.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#604758]">
          O login usa Supabase Auth. Sem as variaveis do Supabase, o formulario mostra erro controlado e nao libera
          acesso falso.
        </p>
      </section>
      <section className="mx-auto mt-10 w-full max-w-md lg:mt-0">
        <AuthForm />
      </section>
    </main>
  );
}
