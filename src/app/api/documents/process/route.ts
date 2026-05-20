import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { documentId } = (await request.json()) as { documentId?: string };
    if (!documentId) return NextResponse.json({ error: "documentId obrigatorio." }, { status: 400 });

    const { data: document, error } = await supabase
      .from("documents")
      .select("id,status")
      .eq("id", documentId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!document) return NextResponse.json({ error: "Documento nao encontrado para este usuario." }, { status: 404 });

    return NextResponse.json({
      message: "Processamento sob demanda registrado. O upload ja executa chunking e embeddings no MVP.",
      status: document.status,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao processar documento." }, { status: 500 });
  }
}
