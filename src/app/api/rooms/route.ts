import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });

    const { name, description } = (await request.json()) as { name?: string; description?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Nome da sala obrigatorio." }, { status: 400 });

    const { data: room, error } = await supabase
      .from("chat_rooms")
      .insert({ user_id: auth.user.id, name, description, access_code: crypto.randomUUID().slice(0, 8).toUpperCase() })
      .select("id")
      .single();
    if (error) throw error;

    await supabase.from("room_members").insert({ user_id: auth.user.id, room_id: room.id, role: "owner" });
    return NextResponse.json({ id: room.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar sala." }, { status: 500 });
  }
}
