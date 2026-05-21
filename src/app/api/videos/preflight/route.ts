import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { size, mimeType } = (await request.json()) as { size?: number; mimeType?: string };
    if (!mimeType || !allowedTypes.includes(mimeType)) return NextResponse.json({ error: "Formato de video nao suportado." }, { status: 400 });

    const maxMb = 80;
    if (size && size > maxMb * 1024 * 1024) return NextResponse.json({ error: `Video excede o limite de ${maxMb}MB nesta fase.` }, { status: 413 });

    const profileResult = await admin.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const { data: profile } = profileResult.data
      ? profileResult
      : await admin.from("users_profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      const { data: license } = await admin
        .from("licenses")
        .select("id,status")
        .eq("user_id", auth.user.id)
        .in("status", ["active", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Plano premium/profissional ativo obrigatorio para enviar videos." }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na validacao do video." }, { status: 500 });
  }
}
