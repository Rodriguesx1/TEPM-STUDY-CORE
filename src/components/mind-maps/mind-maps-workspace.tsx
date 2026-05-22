"use client";

import { useMemo, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MindElixirViewer } from "@/components/mind-maps/mind-elixir-viewer";
import { formatDate } from "@/lib/utils";
import type { MindMapRecord } from "@/types/mind-map";

export function MindMapsWorkspace({ maps, selectedId }: { maps: MindMapRecord[]; selectedId?: string }) {
  const firstId = selectedId && maps.some((map) => map.id === selectedId) ? selectedId : maps[0]?.id;
  const [activeId, setActiveId] = useState(firstId);
  const activeMap = useMemo(() => maps.find((map) => map.id === activeId) ?? maps[0], [activeId, maps]);

  if (!maps.length) {
    return (
      <section className="rounded-[20px] border bg-white/85 p-6 shadow-sm">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-[#183c35]">Nenhum mapa mental gerado ainda</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Abra um PDF processado na Biblioteca e clique em “Gerar mapa mental”. O mapa sera salvo aqui com visualizacao interativa.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <aside className="rounded-[20px] border bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-[#183c35]">Mapas salvos</h2>
          <Badge>{maps.length}</Badge>
        </div>
        <div className="mt-4 space-y-2">
          {maps.map((map) => (
            <button
              key={map.id}
              type="button"
              className={[
                "block w-full rounded-[16px] border p-3 text-left transition",
                map.id === activeMap.id ? "border-primary bg-secondary text-secondary-foreground" : "bg-white/75 hover:border-primary/50",
              ].join(" ")}
              onClick={() => setActiveId(map.id)}
            >
              <span className="block font-semibold">{map.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {map.documents?.title ?? "Sem documento vinculado"} - {formatDate(map.created_at)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        {activeMap ? <MindElixirViewer map={activeMap} /> : null}
      </div>
    </div>
  );
}
