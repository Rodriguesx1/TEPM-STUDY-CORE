"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types/database";

export function DocumentAuditList({ documents }: { documents: DocumentRecord[] }) {
  const [minimized, setMinimized] = useState(false);
  const grouped = useMemo(() => {
    return documents.reduce<Record<string, DocumentRecord[]>>((acc, doc) => {
      const category = doc.theme || "Sem categoria";
      acc[category] = acc[category] ?? [];
      acc[category].push(doc);
      return acc;
    }, {});
  }, [documents]);

  return (
    <section className="rounded-[18px] border border-border bg-white/85 shadow-sm backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-[#35152f]">Controle de conteudo processado</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            PDFs auditados e organizados por categoria mediante o conteudo extraido.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setMinimized((value) => !value)}>
          {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {minimized ? "Maximizar" : "Minimizar"}
        </Button>
      </header>

      {minimized ? (
        <div className="p-5 text-sm text-muted-foreground">
          Lista minimizada. {documents.length} PDF{documents.length === 1 ? "" : "s"} auditado{documents.length === 1 ? "" : "s"}.
        </div>
      ) : (
        <div className="space-y-5 p-5">
          {documents.length ? (
            Object.entries(grouped).map(([category, docs]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-xl font-bold text-[#35152f]">{category}</h3>
                  <Badge>{docs.length} PDF{docs.length === 1 ? "" : "s"}</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-3 py-2">Nome do PDF</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Auditado em</th>
                        <th className="px-3 py-2">Resumo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc) => (
                        <tr key={doc.id} className="rounded-[14px] bg-[#fff8f3] align-top">
                          <td className="max-w-[240px] rounded-l-[14px] px-3 py-3 font-semibold text-[#35152f]">
                            <span className="block truncate" title={doc.title}>{doc.title}</span>
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">{doc.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={doc.status === "processed" ? "border-[#d7bb5f] text-[#795b13]" : "text-destructive"}>
                              {doc.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{formatDate(doc.created_at)}</td>
                          <td className="rounded-r-[14px] px-3 py-3 text-muted-foreground">
                            <p className="line-clamp-2 max-w-xl leading-6">{doc.summary ?? "Ainda sem resumo auditado."}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[14px] bg-secondary p-4 text-sm text-secondary-foreground">
              Nenhum PDF processado ou auditado ainda.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
