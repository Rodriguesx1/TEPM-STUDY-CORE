"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SlidePage, SlideProject } from "@/types/database";

export function SlidesPanel({ projects, pages }: { projects: SlideProject[]; pages: SlidePage[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: "topic", topic }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao gerar slides.");
      setMessage("Slides gerados e salvos.");
      setTopic("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel gerar slides.");
    } finally {
      setLoading(false);
    }
  }

  const pagesByProject = new Map<string, SlidePage[]>();
  pages.forEach((page) => {
    pagesByProject.set(page.project_id, [...(pagesByProject.get(page.project_id) ?? []), page]);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[18px] border bg-white p-4">
        <h3 className="font-semibold text-[#183c35]">Gerar apresentacao editavel</h3>
        <div className="mt-3 space-y-3">
          <Input placeholder="Tema, PDF ou aula que deseja transformar em slides" value={topic} onChange={(event) => setTopic(event.target.value)} />
          <Button type="button" onClick={generate} disabled={loading || !topic.trim()}>{loading ? "Gerando..." : "Gerar slides por tema"}</Button>
          {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
        </div>
      </div>
      {projects.map((project) => (
        <article key={project.id} className="rounded-[18px] border bg-white p-4">
          <h3 className="font-serif text-xl font-bold text-[#183c35]">{project.title}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(pagesByProject.get(project.id) ?? []).map((page) => (
              <div key={page.id} className="rounded-[14px] bg-[#eef8f2] p-4">
                <Input defaultValue={page.title} aria-label="Titulo do slide" />
                <Textarea className="mt-3" defaultValue={page.body} aria-label="Texto do slide" />
                <Textarea className="mt-3" defaultValue={page.speaker_notes ?? ""} aria-label="Notas do apresentador" />
              </div>
            ))}
          </div>
          {project.markdown ? (
            <details className="mt-4 rounded-[14px] bg-[#eef8f2] p-4">
              <summary className="cursor-pointer font-semibold text-[#183c35]">Exportar Markdown</summary>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{project.markdown}</pre>
            </details>
          ) : null}
        </article>
      ))}
      {!projects.length ? <p className="rounded-[18px] border bg-white p-5 text-sm text-muted-foreground">Nenhuma apresentacao criada ainda.</p> : null}
    </div>
  );
}
