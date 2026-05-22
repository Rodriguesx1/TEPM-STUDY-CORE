"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LuxuryBadge, PremiumCard } from "@/components/ui/premium";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getBrowserSupabase();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

      if (result.error) throw result.error;
      if (mode === "signup") {
        setMessage("Cadastro enviado. Confirme o e-mail caso a plataforma solicite validacao.");
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel autenticar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumCard className="w-full max-w-md p-6 sm:p-7">
      <LuxuryBadge>{mode === "login" ? "Acesso privado" : "Novo acesso"}</LuxuryBadge>
      <h2 className="mt-5 font-serif text-4xl leading-none text-[#f3eee8]">{mode === "login" ? "Entre no seu ambiente." : "Crie seu acesso."}</h2>
      <p className="mt-3 text-sm leading-7 text-[#cbbfb1]">
        Seus materiais, trilhas e conversas com IA protegidos em um so lugar.
      </p>
      <div className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" /> : null}
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" minLength={6} required />
          {message ? <p className="rounded-[18px] border border-[#6fae9b]/20 bg-[#102722] p-3 text-sm leading-6 text-[#f2eadf]">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Validando..." : mode === "login" ? "Acessar plataforma" : "Cadastrar"}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="ghost"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Criar uma conta" : "Ja tenho conta"}
          </Button>
        </form>
      </div>
    </PremiumCard>
  );
}
