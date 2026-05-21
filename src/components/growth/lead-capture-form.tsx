"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeadCaptureForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing_phase6", consentMarketing: true }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao registrar interesse.");
      setEmail("");
      setMessage("Interesse registrado. Voce recebera as proximas orientacoes.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar interesse.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-xl rounded-[20px] border border-[#cfe5dc] bg-white/80 p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required />
        <Button disabled={loading}>{loading ? "Enviando..." : "Receber convite"}</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Ao enviar, voce concorda em receber contato sobre acesso e novidades da plataforma.</p>
      {message ? <p className="mt-2 text-sm text-[#14352f]">{message}</p> : null}
    </form>
  );
}
