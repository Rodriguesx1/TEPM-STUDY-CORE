"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PremiumCard, SoftPanel } from "@/components/ui/premium";

export function FocusWorkspace() {
  const [seconds, setSeconds] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl flex-col justify-center gap-6">
      <PremiumCard className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6fae9b]">Modo foco</p>
        <h1 className="mt-6 font-serif text-7xl text-[#f3eee8]">{minutes}:{rest}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#cbbfb1]">
          Uma tarefa por vez. Menos abas, menos menus, mais presenca. Use como ferramenta de estudo, nao como pressao.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => setRunning((value) => !value)}>{running ? "Pausar" : "Iniciar"}</Button>
          <Button variant="outline" onClick={() => { setRunning(false); setSeconds(20 * 60); }}>Resetar 20 min</Button>
          <Button variant="outline" onClick={() => { setRunning(false); setSeconds(5 * 60); }}>Pausa 5 min</Button>
        </div>
      </PremiumCard>
      <SoftPanel>
        <h2 className="font-serif text-2xl text-[#f3eee8]">Fechamento</h2>
        <p className="mt-2 text-sm leading-7 text-[#cbbfb1]">Ao terminar, registre uma frase sobre o que avancou e escolha a proxima acao pequena.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/journal"><Button size="sm">Registrar reflexao</Button></Link>
          <Link href="/dashboard"><Button size="sm" variant="ghost">Voltar</Button></Link>
        </div>
      </SoftPanel>
    </div>
  );
}
