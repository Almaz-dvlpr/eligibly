import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assessment } from "./assess";
import { CRITERIA } from "./skills";
import { roundHalf } from "./levels";

export type Essay = { id: string; submitted_at: string; task_prompt: string; word_count: number; a: Assessment };

export const overall = (a: Assessment) =>
  roundHalf(Object.values(a.criteria).reduce((s, c) => s + c.estimated_band, 0) / 4);

/** Assessed essays, oldest first. */
export async function assessedEssays(db: SupabaseClient, userId: string): Promise<Essay[]> {
  const { data } = await db.from("submissions").select("id, submitted_at, task_prompt, word_count, assessments(scores_json)")
    .eq("student_id", userId).eq("status", "assessed").order("submitted_at", { ascending: true });
  return (data ?? []).flatMap((s: any) => {
    const a = s.assessments?.[0]?.scores_json as Assessment | undefined;
    return a ? [{ id: s.id, submitted_at: s.submitted_at, task_prompt: s.task_prompt, word_count: s.word_count, a }] : [];
  });
}

/** Average of the last three essays, so one lucky or unlucky essay does not swing the number. */
export function currentBand(essays: Essay[]) {
  const last = essays.slice(-3);
  return last.length ? roundHalf(last.reduce((s, e) => s + overall(e.a), 0) / last.length) : null;
}

export function criterionBand(essays: Essay[], key: (typeof CRITERIA)[number]["key"]) {
  const last = essays.slice(-3);
  return last.length ? roundHalf(last.reduce((s, e) => s + e.a.criteria[key].estimated_band, 0) / last.length) : null;
}

export function criterionTrend(essays: Essay[], key: (typeof CRITERIA)[number]["key"]) {
  if (essays.length < 2) return 0;
  const first = essays[0].a.criteria[key].estimated_band;
  return essays[essays.length - 1].a.criteria[key].estimated_band - first;
}

export async function skillRows(db: SupabaseClient, userId: string) {
  const { data } = await db.from("skill_mastery").select("mastery_score, confidence_score, status, attempt_count, skills(code)").eq("student_id", userId);
  return (data ?? []).flatMap((r: any) => (r.skills?.code ? [{ code: r.skills.code as string, score: r.mastery_score as number, confidence: r.confidence_score as number, status: r.status as string, n: r.attempt_count as number }] : []));
}

/** Latest-vs-previous change for each skill, from the event history. */
export async function skillTrends(db: SupabaseClient, userId: string) {
  const { data } = await db.from("skill_assessment_events").select("score, created_at, skills(code)").eq("student_id", userId).order("created_at", { ascending: true });
  const by = new Map<string, number[]>();
  (data ?? []).forEach((r: any) => { const c = r.skills?.code; if (c) by.set(c, [...(by.get(c) ?? []), r.score]); });
  return new Map([...by].map(([c, v]) => [c, v.length > 1 ? v[v.length - 1] - v[v.length - 2] : 0]));
}
