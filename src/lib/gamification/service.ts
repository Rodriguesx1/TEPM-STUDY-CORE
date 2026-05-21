import type { SupabaseClient } from "@supabase/supabase-js";

type AwardInput = {
  userId: string;
  points: number;
  reason: string;
  metadata?: Record<string, unknown>;
};

function calculateLevel(points: number) {
  return Math.max(1, Math.floor(points / 250) + 1);
}

export async function awardStudyPoints(admin: SupabaseClient, input: AwardInput) {
  const points = Math.max(0, Math.trunc(input.points));
  if (!points) return;

  const { data: current } = await admin
    .from("user_points")
    .select("total_points")
    .eq("user_id", input.userId)
    .maybeSingle();

  const nextTotal = (Number(current?.total_points) || 0) + points;
  await admin.from("user_points").upsert({
    user_id: input.userId,
    total_points: nextTotal,
    level: calculateLevel(nextTotal),
    updated_at: new Date().toISOString(),
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: streak } = await admin
    .from("study_streaks")
    .select("current_streak,longest_streak,last_activity_date")
    .eq("user_id", input.userId)
    .maybeSingle();

  const lastDate = streak?.last_activity_date ? new Date(`${streak.last_activity_date}T00:00:00Z`) : null;
  const nowDate = new Date(`${today}T00:00:00Z`);
  const dayDiff = lastDate ? Math.round((nowDate.getTime() - lastDate.getTime()) / 86400000) : null;
  const currentStreak = dayDiff === 0 ? Number(streak?.current_streak ?? 1) : dayDiff === 1 ? Number(streak?.current_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(Number(streak?.longest_streak ?? 0), currentStreak);

  await admin.from("study_streaks").upsert({
    user_id: input.userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  });

  await admin.from("audit_logs").insert({
    user_id: input.userId,
    action: "gamification.points_awarded",
    entity_type: "user_points",
    entity_id: input.userId,
    metadata: { reason: input.reason, points, total_points: nextTotal, ...(input.metadata ?? {}) },
  });

  const { data: achievements } = await admin
    .from("achievements")
    .select("id,code,points_required")
    .lte("points_required", nextTotal);

  if (achievements?.length) {
    await admin.from("user_achievements").upsert(
      achievements.map((achievement) => ({
        user_id: input.userId,
        achievement_id: achievement.id,
        metadata: { awarded_by: "points", code: achievement.code },
      })),
      { onConflict: "user_id,achievement_id" },
    );
  }
}
