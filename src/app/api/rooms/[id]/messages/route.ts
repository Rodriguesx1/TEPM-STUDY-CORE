import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    const admin = getSupabaseAdmin();
    const member = await admin.from("room_members").select("id").eq("room_id", id).eq("user_id", context.userId).maybeSingle();
    if (member.error) throw member.error;
    if (!member.data && !context.isAdmin) return NextResponse.json({ error: "Voce nao participa desta sala." }, { status: 403 });
    const messages = await admin.from("chat_messages").select("id,user_id,room_id,body,created_at").eq("room_id", id).order("created_at", { ascending: true }).limit(100);
    if (messages.error) throw messages.error;
    return NextResponse.json({ messages: messages.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar mensagens." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await getSessionContext();
    if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
    if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria para enviar mensagem." }, { status: 403 });
    const { body } = (await request.json()) as { body?: string };
    if (!body?.trim()) return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
    if (body.length > 2000) return NextResponse.json({ error: "Mensagem muito longa." }, { status: 413 });
    const admin = getSupabaseAdmin();
    const room = await admin.from("chat_rooms").select("id,is_locked").eq("id", id).maybeSingle();
    if (room.error) throw room.error;
    if (!room.data) return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });
    if (room.data.is_locked) return NextResponse.json({ error: "Sala bloqueada." }, { status: 403 });
    const member = await admin.from("room_members").select("id").eq("room_id", id).eq("user_id", context.userId).maybeSingle();
    if (member.error) throw member.error;
    if (!member.data && !context.isAdmin) return NextResponse.json({ error: "Voce nao participa desta sala." }, { status: 403 });
    const inserted = await admin.from("chat_messages").insert({ user_id: context.userId, room_id: id, body }).select("*").single();
    if (inserted.error) throw inserted.error;
    return NextResponse.json({ message: inserted.data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao enviar mensagem." }, { status: 500 });
  }
}
