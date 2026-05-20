"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Selecione um PDF antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha no upload.");
      setMessage(payload.message ?? "PDF enviado e processamento iniciado.");
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel enviar o PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload seguro de PDF</CardTitle>
        <CardDescription>O arquivo e salvo no Storage, registrado por user_id e enviado ao processamento IA.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-primary/40 bg-white/70 p-6 text-center">
            <Upload className="mb-3 h-8 w-8 text-primary" />
            <span className="font-semibold text-[#47203a]">{file ? file.name : "Selecionar PDF"}</span>
            <span className="mt-1 text-sm text-muted-foreground">Limite configuravel por MAX_UPLOAD_MB.</span>
            <input
              className="hidden"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar e processar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
