import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { title, body } = (await request.json()) as { title?: string; body?: string };
    if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "Titulo e corpo sao obrigatorios." }, { status: 400 });

    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: auth.user.id, title, body })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao salvar anotacao." }, { status: 500 });
  }
}
