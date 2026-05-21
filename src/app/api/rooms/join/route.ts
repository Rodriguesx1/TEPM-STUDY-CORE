import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria para entrar em sala." }, { status: 403 });
    const { code } = (await request.json()) as { code?: string };
    if (!code?.trim()) return NextResponse.json({ error: "Codigo obrigatorio." }, { status: 400 });
    const admin = getSupabaseAdmin();
    const invite = await admin
      .from("room_invites")
      .select("id,room_id,status,expires_at,chat_rooms(id,is_locked)")
      .eq("access_code", code.trim().toUpperCase())
      .maybeSingle();
    if (invite.error) throw invite.error;
    if (!invite.data || invite.data.status !== "active") return NextResponse.json({ error: "Convite invalido." }, { status: 404 });
    if (invite.data.expires_at && new Date(invite.data.expires_at) < new Date()) return NextResponse.json({ error: "Convite expirado." }, { status: 403 });
    const room = Array.isArray(invite.data.chat_rooms) ? invite.data.chat_rooms[0] : invite.data.chat_rooms;
    if (room?.is_locked) return NextResponse.json({ error: "Sala bloqueada." }, { status: 403 });

    const member = await admin.from("room_members").upsert({ user_id: context.userId, room_id: invite.data.room_id, role: "member" }, { onConflict: "user_id,room_id" });
    if (member.error) throw member.error;
    await admin.from("audit_logs").insert({ user_id: context.userId, action: "room.joined", entity_type: "chat_rooms", entity_id: invite.data.room_id });
    return NextResponse.json({ roomId: invite.data.room_id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao entrar na sala." }, { status: 500 });
  }
}
