import { AppShell } from "@/components/layout/app-shell";
import { DocumentAuditList } from "@/components/library/document-audit-list";
import { UploadPanel } from "@/components/library/upload-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePremium } from "@/lib/auth/guards";
import { getServerSupabase } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const context = await requirePremium();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });
  const documents = (data as DocumentRecord[] | null) ?? [];

  return (
    <AppShell context={context}>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <UploadPanel />
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca</CardTitle>
              <CardDescription>Arquivos isolados por usuario, com status, categoria e resumo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {error ? <p className="rounded-[14px] bg-[#fff1f2] p-3 text-sm text-destructive">{error.message}</p> : null}
              {documents.slice(0, 3).map((doc) => (
                <article key={doc.id} className="rounded-[16px] border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-[#35152f]">{doc.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{doc.theme ?? "Sem categoria"}</Badge>
                      <Badge>{doc.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                  {doc.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{doc.summary}</p> : null}
                </article>
              ))}
              {!documents.length && !error ? <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p> : null}
            </CardContent>
          </Card>
        </div>
        <DocumentAuditList documents={documents} />
      </div>
    </AppShell>
  );
}
