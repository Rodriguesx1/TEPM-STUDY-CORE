"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAnswer(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha no chat.");
      setAnswer(payload.answer ?? "Sem resposta.");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Nao foi possivel consultar a IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentora IA</CardTitle>
        <CardDescription>Consulta seus chunks e usa Gemini com fallback OpenRouter quando configurado.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={ask} className="space-y-4">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunte sobre seus materiais..." required />
          <Button type="submit" disabled={loading}>
            {loading ? "Consultando..." : "Perguntar"}
          </Button>
        </form>
        {answer ? <div className="mt-5 rounded-[18px] bg-[#14352f] p-5 text-sm leading-7 text-white">{answer}</div> : null}
      </CardContent>
    </Card>
  );
}
