"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { DocumentWithChunks } from "@/types/database";

export function DocumentLibraryPanel({ documents, error }: { documents: DocumentWithChunks[]; error?: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Biblioteca</CardTitle>
          <CardDescription>Arquivos isolados por usuario, com status, categoria e leitura interna.</CardDescription>
        </div>
        <Badge>{documents.length} PDF{documents.length === 1 ? "" : "s"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error}</p> : null}
        {documents.map((doc) => {
          const isCollapsed = collapsed[doc.id] ?? false;
          const isExpanded = expanded[doc.id] ?? false;
          const content = doc.chunks.length
            ? doc.chunks.map((chunk) => chunk.content).join("\n\n")
            : doc.summary ?? "Ainda nao ha conteudo extraido para leitura.";

          return (
            <article key={doc.id} className="rounded-[16px] border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold leading-6 text-[#35152f]">{doc.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{doc.theme ?? "Sem categoria"}</Badge>
                    <Badge>{doc.status}</Badge>
                    <Badge>{doc.chunks.length} chunk{doc.chunks.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCollapsed((current) => ({ ...current, [doc.id]: !isCollapsed }))}
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    {isCollapsed ? "Maximizar" : "Minimizar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded((current) => ({ ...current, [doc.id]: !isExpanded }))}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    {isExpanded ? "Compactar" : "Expandir"}
                  </Button>
                </div>
              </div>

              {isCollapsed ? null : (
                <div
                  className={[
                    "mt-4 rounded-[14px] border border-[#ead8da] bg-[#fff8f3] p-4 text-sm leading-7 text-muted-foreground",
                    "overflow-y-auto pr-3",
                    isExpanded ? "max-h-[34rem]" : "max-h-44",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap">{content}</p>
                </div>
              )}
            </article>
          );
        })}
        {!documents.length && !error ? <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p> : null}
      </CardContent>
    </Card>
  );
}
