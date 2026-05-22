"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrainCircuit, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MindElixirViewer } from "@/components/mind-maps/mind-elixir-viewer";
import { formatDate } from "@/lib/utils";
import type { MindMapRecord } from "@/types/mind-map";

export function MindMapsWorkspace({ maps, selectedId }: { maps: MindMapRecord[]; selectedId?: string }) {
  const router = useRouter();
  const firstId = selectedId && maps.some((map) => map.id === selectedId) ? selectedId : maps[0]?.id;
  const [activeId, setActiveId] = useState(firstId);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const activeMap = useMemo(() => maps.find((map) => map.id === activeId) ?? maps[0], [activeId, maps]);

  async function createMindMap() {
    setCreating(true);
    setCreateError(null);
    try {
      const response = await fetch("/api/mind-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const payload = (await response.json()) as { error?: string; mindMap?: { id: string } };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao criar mapa mental.");
      if (payload.mindMap?.id) router.push(`/dashboard/mind-maps?map=${payload.mindMap.id}`);
      router.refresh();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Nao foi possivel criar o mapa mental.");
    } finally {
      setCreating(false);
    }
  }

  if (!maps.length) {
    return (
      <section className="rounded-[20px] border bg-white/85 p-6 shadow-sm">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-[#183c35]">Nenhum mapa mental gerado ainda</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Abra um PDF processado na Biblioteca e clique em "Gerar mapa mental", ou crie seu proprio mapa do zero.
        </p>
        <div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do seu mapa mental" />
          <Button type="button" onClick={createMindMap} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Criando..." : "Criar do zero"}
          </Button>
        </div>
        {createError ? <p className="mt-3 rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{createError}</p> : null}
      </section>
    );
  }

  return (
    <div className={["grid gap-5", sidebarHidden ? "lg:grid-cols-1" : "lg:grid-cols-[22rem_1fr]"].join(" ")}>
      {!sidebarHidden ? (
        <aside className="rounded-[20px] border bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-[#183c35]">Mapas salvos</h2>
            <div className="flex items-center gap-2">
              <Badge>{maps.length}</Badge>
              <Button type="button" variant="outline" size="icon" title="Ocultar lista lateral" onClick={() => setSidebarHidden(true)}>
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-[16px] border bg-[#eef8f2] p-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Novo mapa mental" />
            <Button type="button" className="w-full" onClick={createMindMap} disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Criando..." : "Criar do zero"}
            </Button>
            {createError ? <p className="rounded-[12px] bg-[#fff1f2] p-2 text-xs text-destructive">{createError}</p> : null}
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
      ) : null}

      <div className="min-w-0">
        {sidebarHidden ? (
          <Button type="button" variant="outline" size="sm" className="mb-3" onClick={() => setSidebarHidden(false)}>
            <PanelLeftOpen className="h-4 w-4" />
            Mostrar mapas salvos
          </Button>
        ) : null}
        {activeMap ? <MindElixirViewer map={activeMap} /> : null}
      </div>
    </div>
  );
}
