"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrowserSupabase } from "@/lib/supabase/client";

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as { error?: string; message?: string };
  } catch {
    return { error: text || "Resposta invalida do servidor." };
  }
}

export function UploadPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Selecione um PDF antes de enviar.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (file.type !== "application/pdf") throw new Error("Somente PDF e aceito.");
      const supabase = getBrowserSupabase();
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw new Error("Login obrigatorio para enviar PDF.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userResult.user.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("study-documents").upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const response = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, title: file.name, mimeType: file.type, size: file.size }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error ?? "Falha no processamento.");
      setMessage(payload.message ?? "PDF enviado e processamento iniciado.");
      setFile(null);
      router.refresh();
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
