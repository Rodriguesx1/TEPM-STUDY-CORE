import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  const sessions = await admin.from("productivity_sessions").select("*").eq("user_id", context.userId).order("started_at", { ascending: false }).limit(20);
  if (sessions.error) return NextResponse.json({ error: sessions.error.message }, { status: 500 });
  const totalMinutes = (sessions.data ?? []).reduce((sum, item) => sum + Number(item.duration_minutes ?? 0), 0);
  return NextResponse.json({ sessions: sessions.data ?? [], totalMinutes });
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  if (!context.hasPremiumAccess) return NextResponse.json({ error: "Licenca ativa obrigatoria." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { mode?: string; title?: string; durationMinutes?: number };
  const admin = getSupabaseAdmin();
  const inserted = await admin
    .from("productivity_sessions")
    .insert({
      user_id: context.userId,
      mode: body.mode ?? "focus",
      title: body.title?.trim() || "Sessao de foco",
      duration_minutes: Math.min(180, Math.max(5, Number(body.durationMinutes ?? 25))),
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
  await admin.from("memory_events").insert({ user_id: context.userId, event_type: "productivity.completed", source_type: "productivity_session", source_id: inserted.data.id, title: inserted.data.title, content: `Sessao de produtividade concluida: ${inserted.data.duration_minutes} minutos.`, weight: 0.7 });
  return NextResponse.json({ session: inserted.data });
}
