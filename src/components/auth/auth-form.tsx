"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
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
        setMessage("Cadastro enviado. Confirme o e-mail caso o Supabase exija confirmação.");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Entrar" : "Criar acesso"}</CardTitle>
        <CardDescription>Use sua conta autorizada. Recursos premium dependem de licença ativa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" /> : null}
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" required />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" minLength={6} required />
          {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
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
      </CardContent>
    </Card>
  );
}
