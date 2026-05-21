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

    const { data: video, error } = await admin.from("videos").select("id,user_id,file_path").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (!video) return NextResponse.json({ error: "Video nao encontrado." }, { status: 404 });

    await admin.from("embeddings").delete().eq("user_id", auth.user.id).eq("metadata->>video_id", id);
    await admin.from("video_chunks").delete().eq("video_id", id).eq("user_id", auth.user.id);
    await admin.from("video_transcripts").delete().eq("video_id", id).eq("user_id", auth.user.id);
    await admin.from("videos").delete().eq("id", id).eq("user_id", auth.user.id);
    if (video.file_path) await admin.storage.from("study-videos").remove([video.file_path]);
    await admin.from("audit_logs").insert({ user_id: auth.user.id, action: "video.deleted", entity_type: "videos", entity_id: id });

    return NextResponse.json({ message: "Video excluido com seguranca." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao excluir video." }, { status: 500 });
  }
}
