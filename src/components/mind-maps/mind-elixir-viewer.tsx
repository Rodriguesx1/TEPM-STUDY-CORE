"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, LocateFixed, Maximize2, Minimize2 } from "lucide-react";
import type { MindElixirData, MindElixirInstance } from "mind-elixir";
import { Button } from "@/components/ui/button";
import { toMindElixirData } from "@/lib/mind-maps/adapter";
import type { MindMapRecord } from "@/types/mind-map";

export function MindElixirViewer({ map }: { map: MindMapRecord }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = useMemo(() => toMindElixirData(map.map_json, map.title), [map]);

  useEffect(() => {
    let mounted = true;

    async function render() {
      if (!containerRef.current) return;
      setError(null);
      try {
        const MindElixir = (await import("mind-elixir")).default;
        instanceRef.current?.destroy();
        if (!mounted || !containerRef.current) return;

        const instance = new MindElixir({
          el: containerRef.current,
          direction: MindElixir.SIDE,
          editable: true,
          toolBar: true,
          keypress: true,
          contextMenu: true,
          mobileMultiSelect: true,
          overflowHidden: false,
          theme: {
            name: "tepm-premium",
            type: "light",
            palette: ["#2f7d68", "#9d2f5d", "#c7a64b", "#7f6fb5", "#183c35"],
            cssVar: {
              "--node-gap-x": "32px",
              "--node-gap-y": "18px",
              "--main-gap-x": "72px",
              "--main-gap-y": "36px",
              "--main-color": "#f8fff9",
              "--main-bgcolor": "#2f7d68",
              "--main-bgcolor-transparent": "rgba(47, 125, 104, 0.14)",
              "--color": "#142d29",
              "--bgcolor": "#f3fbf6",
              "--selected": "#e2c875",
              "--accent-color": "#9d2f5d",
              "--root-color": "#f8fff9",
              "--root-bgcolor": "#14352f",
              "--root-border-color": "#c7a64b",
              "--root-radius": "16px",
              "--main-radius": "14px",
              "--topic-padding": "8px 12px",
              "--panel-color": "#142d29",
              "--panel-bgcolor": "#ffffff",
              "--panel-border-color": "#cfe2d8",
              "--map-padding": "48px",
            },
          },
        });

        instance.init(data as MindElixirData);
        instance.scaleFit();
        instanceRef.current = instance;
      } catch (renderError) {
        setError(renderError instanceof Error ? renderError.message : "Nao foi possivel renderizar o mapa mental.");
      }
    }

    render();

    return () => {
      mounted = false;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [data]);

  async function exportPng() {
    try {
      const blob = await instanceRef.current?.exportPng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${map.title}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Nao foi possivel exportar o mapa mental.");
    }
  }

  function centerMap() {
    instanceRef.current?.scaleFit();
  }

  function toggleExpanded() {
    setExpanded((value) => !value);
    window.setTimeout(() => instanceRef.current?.scaleFit(), 180);
  }

  return (
    <section className="relative rounded-[20px] border bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="relative z-30 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#183c35]">{map.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {map.documents?.title ? `Fonte: ${map.documents.title}` : "Mapa mental salvo"}{" "}
            {map.documents?.theme ? `- ${map.documents.theme}` : ""}
          </p>
        </div>
        <div className="relative z-40 flex flex-wrap gap-2" onPointerDown={(event) => event.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" onClick={centerMap}>
            <LocateFixed className="h-4 w-4" />
            Centralizar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={toggleExpanded}>
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {expanded ? "Compactar" : "Expandir"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={exportPng}>
            <Download className="h-4 w-4" />
            PNG
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error}</p> : null}

      <div
        ref={containerRef}
        className={[
          "relative z-0 mt-4 w-full overflow-hidden rounded-[18px] border border-border bg-[#f3fbf6]",
          expanded ? "h-[76vh]" : "h-[34rem]",
        ].join(" ")}
      />

      {map.markdown ? (
        <details className="mt-4 rounded-[16px] border bg-[#eef8f2] p-4">
          <summary className="cursor-pointer font-semibold text-[#183c35]">Ver estrutura em markdown</summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{map.markdown}</pre>
        </details>
      ) : null}
    </section>
  );
}
