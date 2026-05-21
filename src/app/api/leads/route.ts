import { NextResponse } from "next/server";
import { checkRateLimit, ipKey } from "@/lib/security/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  const rate = await checkRateLimit({ admin, route: "/api/leads", key: ipKey(request), maxRequests: 5, windowSeconds: 3600 });
  if (!rate.allowed) return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });

  const payload = (await request.json()) as { email?: string; name?: string; source?: string; consentMarketing?: boolean };
  const email = payload.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail valido obrigatorio." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("lead_captures")
    .upsert(
      {
        email,
        name: payload.name?.trim().slice(0, 120) || null,
        source: payload.source?.trim().slice(0, 80) || "landing",
        consent_marketing: Boolean(payload.consentMarketing),
        metadata: { user_agent: request.headers.get("user-agent") },
      },
      { onConflict: "email,source" },
    )
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
