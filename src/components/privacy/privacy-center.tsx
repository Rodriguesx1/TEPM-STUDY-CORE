"use client";

import { useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function PrivacyCenter() {
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [exporting, setExporting] = useState(false);

  async function consent(consentType: string, status: "accepted" | "revoked") {
    const response = await fetch("/api/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consent", consentType, status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar consentimento.");
    setMessage("Consentimento atualizado.");
  }

  async function exportData() {
    setExporting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/privacy", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao exportar dados.");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tepm-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Exportacao gerada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao exportar dados.");
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    const response = await fetch("/api/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_request", reason }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) throw new Error(payload.error ?? "Falha ao solicitar exclusao.");
    setMessage(payload.message ?? "Solicitacao de exclusao registrada com prazo de seguranca.");
  }

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-[16px] border border-[#cfe5dc] bg-[#e8f4ef] p-3 text-sm text-[#14352f]">{message}</div> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#2f7d69]" />Consentimentos LGPD</CardTitle>
            <CardDescription>Controle explicito para termos, privacidade, upload e processamento por IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["terms", "Termos de uso"],
              ["privacy", "Politica de privacidade"],
              ["upload_processing", "Processamento de uploads"],
              ["ai_processing", "Processamento por IA"],
              ["marketing", "Comunicacoes e novidades"],
            ].map(([type, label]) => (
              <div key={type} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border bg-white p-3">
                <span className="font-semibold text-[#14352f]">{label}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => consent(type, "accepted")}>Aceitar</Button>
                  <Button size="sm" variant="outline" onClick={() => consent(type, "revoked")}>Revogar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Exportacao e exclusao</CardTitle>
            <CardDescription>Direito de acesso e solicitacao de exclusao com janela de seguranca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportData} disabled={exporting}><Download className="mr-2 h-4 w-4" />Exportar meus dados</Button>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo opcional da exclusao" />
            <Button variant="danger" onClick={requestDeletion}><Trash2 className="mr-2 h-4 w-4" />Solicitar exclusao da conta</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
