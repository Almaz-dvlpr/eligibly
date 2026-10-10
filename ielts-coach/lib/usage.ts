import type { SupabaseClient } from "@supabase/supabase-js";

/** Today's (UTC) usage of an AI operation by one user. Failed calls are counted separately: they must not use up the daily allowance. */
export async function usageToday(db: SupabaseClient, userId: string, operation: string) {
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const { data } = await db.from("ai_usage_logs").select("status").eq("user_id", userId).eq("operation_type", operation)
    .gte("created_at", dayStart.toISOString()).limit(1000);
  const rows = data ?? [];
  return { ok: rows.filter((r) => r.status === "ok").length, failed: rows.filter((r) => r.status !== "ok").length };
}

/** Returns an error message when the user is over a limit, otherwise null. Failures only stop a user at 3x the limit (abuse guard). */
export async function limitMessage(db: SupabaseClient, userId: string, operation: string, limit: number, noun: string) {
  const u = await usageToday(db, userId, operation);
  if (u.ok >= limit) return `Daily limit of ${limit} ${noun} reached. Please come back tomorrow.`;
  if (u.failed >= limit * 3) return `Too many failed attempts today. Please try again tomorrow.`;
  return null;
}
