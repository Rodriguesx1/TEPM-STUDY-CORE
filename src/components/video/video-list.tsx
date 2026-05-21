"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VideoRecord } from "@/types/database";

export function VideoList({ videos }: { videos: VideoRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function remove(id: string) {
    const confirmed = window.confirm("Excluir este video, transcricao e memoria vetorial?");
    if (!confirmed) return;
    const response = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string; error?: string };
    setMessage(response.ok ? payload.message ?? "Video excluido." : payload.error ?? "Falha ao excluir video.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
      {videos.map((video) => (
        <article key={video.id} className="rounded-[18px] border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#183c35]">{video.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{video.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{video.status}</Badge>
                <Badge>{video.transcript_status}</Badge>
                {video.file_size ? <Badge>{Math.round(video.file_size / 1024 / 1024)}MB</Badge> : null}
              </div>
            </div>
            <Button type="button" variant="danger" size="sm" onClick={() => remove(video.id)}>Excluir</Button>
          </div>
          {video.summary ? <p className="mt-4 rounded-[14px] bg-[#eef8f2] p-3 text-sm leading-6 text-muted-foreground">{video.summary}</p> : null}
        </article>
      ))}
      {!videos.length ? <p className="rounded-[18px] border bg-white p-5 text-sm text-muted-foreground">Nenhum video enviado ainda.</p> : null}
    </div>
  );
}
