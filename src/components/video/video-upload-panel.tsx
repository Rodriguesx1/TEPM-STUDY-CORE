"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBrowserSupabase } from "@/lib/supabase/client";

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as { error?: string; message?: string };
  } catch {
    return { error: text || "Resposta invalida." };
  }
}

export function VideoUploadPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Selecione um video.");
    setLoading(true);
    setMessage(null);
    try {
      const preflight = await fetch("/api/videos/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type, size: file.size }),
      });
      const preflightPayload = await readJson(preflight);
      if (!preflight.ok) throw new Error(preflightPayload.error ?? "Video nao autorizado.");

      const supabase = getBrowserSupabase();
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw new Error("Login obrigatorio.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userResult.user.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("study-videos").upload(filePath, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;

      const response = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, title: title || file.name, description, mimeType: file.type, size: file.size }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(payload.error ?? "Falha ao processar video.");
      setMessage(payload.message ?? "Video processado.");
      setFile(null);
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no upload de video.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de video</CardTitle>
        <CardDescription>Videos ficam privados, transcritos por IA e enviados para memoria vetorial.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Input placeholder="Titulo da aula" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea placeholder="Descricao opcional" value={description} onChange={(event) => setDescription(event.target.value)} />
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-primary/40 bg-white/70 p-6 text-center">
            <Upload className="mb-3 h-8 w-8 text-primary" />
            <span className="font-semibold text-[#183c35]">{file ? file.name : "Selecionar video"}</span>
            <span className="mt-1 text-sm text-muted-foreground">MP4, WebM ou MOV ate 80MB nesta fase.</span>
            <input className="hidden" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
          <Button type="submit" disabled={loading}>{loading ? "Processando..." : "Enviar e transcrever"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
