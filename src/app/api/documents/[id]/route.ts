import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { data: document, error } = await admin
      .from("documents")
      .select("id,user_id,file_path")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!document) return NextResponse.json({ error: "Documento nao encontrado." }, { status: 404 });

    await admin.from("embeddings").delete().eq("user_id", auth.user.id).eq("metadata->>document_id", id);
    await admin.from("document_chunks").delete().eq("document_id", id).eq("user_id", auth.user.id);
    await admin.from("documents").delete().eq("id", id).eq("user_id", auth.user.id);
    if (document.file_path) {
      await admin.storage.from("study-documents").remove([document.file_path]);
    }
    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: "document.deleted", entity_type: "documents", entity_id: id });

    return NextResponse.json({ message: "Documento excluido com seguranca." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao excluir documento." }, { status: 500 });
  }
}
