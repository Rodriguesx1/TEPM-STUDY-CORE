import { AppShell } from "@/components/layout/app-shell";
import { DocumentLibraryPanel } from "@/components/library/document-library-panel";
import { DocumentAuditList } from "@/components/library/document-audit-list";
import { UploadPanel } from "@/components/library/upload-panel";
import { requirePremium } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { DocumentChunk, DocumentRecord, DocumentWithChunks } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const context = await requirePremium();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });
  const documents = (data as DocumentRecord[] | null) ?? [];
  const documentIds = documents.map((doc) => doc.id);
  const { data: chunksData } = documentIds.length
    ? await supabase
        .from("document_chunks")
        .select("id,user_id,document_id,chunk_index,content,token_count,created_at")
        .eq("user_id", context.userId)
        .in("document_id", documentIds)
        .order("chunk_index", { ascending: true })
    : { data: [] };
  const chunks = (chunksData as DocumentChunk[] | null) ?? [];
  const chunksByDocument = chunks.reduce<Record<string, DocumentChunk[]>>((acc, chunk) => {
    acc[chunk.document_id] = acc[chunk.document_id] ?? [];
    acc[chunk.document_id].push(chunk);
    return acc;
  }, {});
  const documentsWithChunks: DocumentWithChunks[] = documents.map((doc) => ({
    ...doc,
    chunks: chunksByDocument[doc.id] ?? [],
  }));

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <UploadPanel />
          <DocumentLibraryPanel documents={documentsWithChunks} error={error?.message} />
        </div>
        <DocumentAuditList documents={documentsWithChunks} />
      </div>
    </AppShell>
  );
}
