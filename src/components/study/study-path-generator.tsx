"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StudyPathGenerator({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study-paths/generate", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao gerar trilha.");
      setMessage("Trilha gerada com base nos seus materiais.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel gerar trilha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
      <Button type="button" disabled={disabled || loading} onClick={generate}>
        {loading ? "Gerando trilha..." : "Gerar trilha com base nos meus materiais"}
      </Button>
    </div>
  );
}
