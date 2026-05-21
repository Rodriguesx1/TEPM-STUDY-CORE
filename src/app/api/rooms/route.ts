import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("room_members")
      .select("role,chat_rooms(id,user_id,name,description,access_code,is_locked,created_at)")
      .eq("user_id", context.userId);
    if (error) throw error;
    return NextResponse.json({ rooms: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao listar salas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria para criar sala." }, { status: 403 });
    const admin = getSupabaseAdmin();

    const { name, description } = (await request.json()) as { name?: string; description?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Nome da sala obrigatorio." }, { status: 400 });
    const accessCode = crypto.randomUUID().slice(0, 8).toUpperCase();
    const { data: room, error } = await admin
      .from("chat_rooms")
      .insert({ user_id: context.userId, name, description, access_code: accessCode })
      .select("id")
      .single();
    if (error) throw error;

    const member = await admin.from("room_members").insert({ user_id: context.userId, room_id: room.id, role: "owner" });
    if (member.error) throw member.error;
    await admin.from("room_invites").insert({ user_id: context.userId, room_id: room.id, access_code: accessCode });
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "room.created", entity_type: "chat_rooms", entity_id: room.id });
    return NextResponse.json({ id: room.id, accessCode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar sala." }, { status: 500 });
  }
}
