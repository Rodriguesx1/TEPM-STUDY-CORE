import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { buildCyclePredictions, estimateCyclePhase } from "@/lib/sensitive/cycle";
import { requireSensitiveConsent, safeSensitiveMetadata } from "@/lib/sensitive/consent";
import { validateSameOrigin } from "@/lib/security/request-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  try {
    await requireSensitiveConsent(admin, context.userId, "cycle_tracking");
  } catch {
    return NextResponse.json({ requiresConsent: true, profile: null, entries: [], predictions: [] });
  }

  const [profile, entries, predictions] = await Promise.all([
    admin.from("cycle_profiles").select("*").eq("user_id", context.userId).maybeSingle(),
    admin.from("cycle_entries").select("*").eq("user_id", context.userId).order("entry_date", { ascending: false }).limit(60),
    admin.from("cycle_predictions").select("*").eq("user_id", context.userId).order("predicted_date", { ascending: true }).limit(45),
  ]);
  return NextResponse.json({ profile: profile.data, entries: entries.data ?? [], predictions: predictions.data ?? [], requiresConsent: false });
}

export async function POST(request: Request) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  const admin = getSupabaseAdmin();
  await requireSensitiveConsent(admin, context.userId, "cycle_tracking");

  const payload = (await request.json()) as {
    action?: "profile" | "entry";
    lastPeriodStart?: string;
    averageCycleLength?: number;
    averagePeriodLength?: number;
    entryDate?: string;
    mood?: string;
    energyLevel?: number;
    symptoms?: string[];
    privateNotes?: string;
    useForAi?: boolean;
  };

  if (payload.action === "profile") {
    const averageCycleLength = Math.min(60, Math.max(15, Number(payload.averageCycleLength ?? 28)));
    const averagePeriodLength = Math.min(15, Math.max(1, Number(payload.averagePeriodLength ?? 5)));
    const { data, error } = await admin
      .from("cycle_profiles")
      .upsert(
        {
          user_id: context.userId,
          is_enabled: true,
          last_period_start: payload.lastPeriodStart || null,
          average_cycle_length: averageCycleLength,
          average_period_length: averagePeriodLength,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const predictions = buildCyclePredictions(payload.lastPeriodStart, averageCycleLength, averagePeriodLength).map((item) => ({ ...item, user_id: context.userId }));
    await admin.from("cycle_predictions").delete().eq("user_id", context.userId);
    await admin.from("cycle_predictions").insert(predictions);
    await admin.from("privacy_logs").insert({ user_id: context.userId, action: "cycle.profile_saved", status: "completed", metadata: safeSensitiveMetadata() });
    return NextResponse.json({ profile: data });
  }

  if (payload.action === "entry") {
    const entryDate = payload.entryDate || new Date().toISOString().slice(0, 10);
    const profile = await admin.from("cycle_profiles").select("last_period_start,average_cycle_length,average_period_length").eq("user_id", context.userId).maybeSingle();
    const phase = estimateCyclePhase(new Date(`${entryDate}T00:00:00`), profile.data?.last_period_start, profile.data?.average_cycle_length, profile.data?.average_period_length);
    const { data, error } = await admin
      .from("cycle_entries")
      .upsert(
        {
          user_id: context.userId,
          entry_date: entryDate,
          phase,
          mood: payload.mood?.slice(0, 80) || null,
          energy_level: payload.energyLevel ? Math.min(5, Math.max(1, Number(payload.energyLevel))) : null,
          symptoms: Array.isArray(payload.symptoms) ? payload.symptoms.slice(0, 12) : [],
          private_notes: payload.privateNotes?.slice(0, 3000) || null,
          use_for_ai: Boolean(payload.useForAi),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,entry_date" },
      )
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("privacy_logs").insert({ user_id: context.userId, action: "cycle.entry_saved", status: "completed", metadata: safeSensitiveMetadata({ entry_date: entryDate }) });
    return NextResponse.json({ entry: data });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}
