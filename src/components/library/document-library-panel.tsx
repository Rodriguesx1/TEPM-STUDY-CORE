"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, FileText, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { DocumentWithChunks } from "@/types/database";

function getDocumentContent(doc: DocumentWithChunks) {
  return doc.chunks.length
    ? doc.chunks.map((chunk) => chunk.content).join("\n\n")
    : doc.summary ?? "Ainda nao ha conteudo extraido para leitura.";
}

export function DocumentLibraryPanel({ documents, error }: { documents: DocumentWithChunks[]; error?: string }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(documents[0]?.id ?? null);
  const selectedDocument = useMemo(() => {
    return documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0] ?? null;
  }, [documents, selectedDocumentId]);

  async function deleteSelectedDocument() {
    if (!selectedDocument || deleting) return;
    const confirmed = window.confirm(`Excluir o PDF "${selectedDocument.title}" e todos os chunks da memoria?`);
    if (!confirmed) return;

    setDeleting(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao excluir documento.");
      setActionMessage(payload.message ?? "Documento excluido.");
      router.refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o documento.");
    } finally {
      setDeleting(false);
    }
  }
  const selectedContent = selectedDocument ? getDocumentContent(selectedDocument) : "";

  useEffect(() => {
    if (!documents.length) {
      setSelectedDocumentId(null);
      return;
    }

    if (!selectedDocumentId || !documents.some((doc) => doc.id === selectedDocumentId)) {
      setSelectedDocumentId(documents[0].id);
    }
  }, [documents, selectedDocumentId]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Biblioteca</CardTitle>
          <CardDescription>Selecione um PDF e leia o conteudo extraido dentro deste unico card.</CardDescription>
        </div>
        <Badge>{documents.length} PDF{documents.length === 1 ? "" : "s"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error}</p> : null}
        {actionMessage ? <p className="rounded-[14px] bg-secondary p-3 text-sm text-secondary-foreground">{actionMessage}</p> : null}
        {documents.length ? (
          <article className="rounded-[16px] border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-6 text-[#183c35]">Conteudo do PDF selecionado</h3>
                <p className="mt-1 text-sm text-muted-foreground">Os PDFs abaixo trocam o texto dentro deste mesmo card.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCollapsed((current) => !current)}>
                  {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  {collapsed ? "Maximizar" : "Minimizar"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((current) => !current)}>
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {expanded ? "Compactar" : "Expandir"}
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={deleteSelectedDocument} disabled={deleting}>
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] border border-border bg-[#eef8f2] p-3">
              <label htmlFor="active-document" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <FileText className="h-4 w-4 text-primary" />
                PDF ativo para leitura
              </label>
              <select
                id="active-document"
                value={selectedDocument?.id ?? ""}
                onChange={(event) => setSelectedDocumentId(event.target.value)}
                className="h-11 w-full rounded-[14px] border border-input bg-white/90 px-3 text-sm font-semibold text-[#183c35] outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument ? (
              <div className="mt-4 rounded-[14px] border border-border bg-[#eef8f2] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold leading-6 text-[#183c35]">{selectedDocument.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(selectedDocument.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedDocument.theme ?? "Sem categoria"}</Badge>
                    <Badge>{selectedDocument.status}</Badge>
                    <Badge>{selectedDocument.chunks.length} chunk{selectedDocument.chunks.length === 1 ? "" : "s"}</Badge>
                  </div>
                </div>

                {collapsed ? null : (
                  <div
                    className={[
                      "mt-4 rounded-[12px] bg-white/75 p-4 text-sm leading-7 text-muted-foreground",
                      "overflow-y-auto pr-3",
                      expanded ? "max-h-[34rem]" : "max-h-52",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap">{selectedContent}</p>
                  </div>
                )}
              </div>
            ) : null}
          </article>
        ) : null}
        {!documents.length && !error ? <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p> : null}
      </CardContent>
    </Card>
  );
}

