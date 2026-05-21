import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { getEnv } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const admin = getSupabaseAdmin();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { size, mimeType } = (await request.json()) as { size?: number; mimeType?: string };
    if (mimeType !== "application/pdf") return NextResponse.json({ error: "Somente PDF e aceito." }, { status: 400 });

    const maxMb = Number(getEnv("MAX_UPLOAD_MB") ?? "25");
    if (size && size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Arquivo excede o limite de ${maxMb}MB.` }, { status: 413 });
    }

    const profileResult = await admin.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const { data: profile } = profileResult.data
      ? profileResult
      : await admin.from("users_profiles").select("role").eq("id", auth.user.id).maybeSingle();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      const { data: license } = await admin
        .from("licenses")
        .select("id")
        .eq("user_id", auth.user.id)
        .in("status", ["active", "trial", "lifetime"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (!license) return NextResponse.json({ error: "Licenca ativa obrigatoria para enviar PDF." }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na validacao do upload." }, { status: 500 });
  }
}
