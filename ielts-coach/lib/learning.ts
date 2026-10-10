import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assessment } from "./assess";
import { LABELS } from "./criteria";
import { SKILLS, skillByCode } from "./skills";
import { levelFor } from "./levels";

const clamp = (x: number) => Math.min(1, Math.max(0, x));
// Band 3.5 -> 0, band 8 -> 1: the prior a skill gets from its criterion band.
const priorFromBand = (band: number) => clamp((band - 3.5) / 4.5);

export function skillScore(a: Assessment, code: string) {
  const skill = skillByCode(code)!;
  const prior = priorFromBand(a.criteria[skill.criterion].estimated_band);
  const ev = a.skill_evidence.find((e) => e.skill_code === code);
  if (!ev) return { score: prior, confidence: 0.3 };
  let score = prior;
  if (typeof ev.score === "number") score = 0.7 * ev.score + 0.3 * prior; // model detail, anchored to the band
  else if (ev.evidence_status === "ok") score = Math.max(prior, 0.7);
  else if (ev.evidence_status === "needs_practice") score = Math.min(prior, 0.45);
  const confidence = ev.evidence_status === "insufficient_data" ? ev.confidence * 0.5 : ev.confidence;
  return { score: clamp(score), confidence: clamp(confidence) };
}

/** Records graded evidence for all skills and recomputes mastery from the last 5 essays (recent and confident ones weigh more). */
export async function applyAssessment(db: SupabaseClient, userId: string, submissionId: string, a: Assessment) {
  const { data: skills } = await db.from("skills").select("id, code, name");
  const byCode = new Map((skills ?? []).map((s) => [s.code as string, s]));

  for (const sk of SKILLS) {
    const row = byCode.get(sk.code);
    if (!row) continue;
    const { score, confidence } = skillScore(a, sk.code);
    await db.from("skill_assessment_events").upsert(
      { student_id: userId, skill_id: row.id, submission_id: submissionId, score, confidence },
      { onConflict: "submission_id,skill_id" },
    );
    const { data: events } = await db.from("skill_assessment_events").select("score, confidence")
      .eq("student_id", userId).eq("skill_id", row.id).order("created_at", { ascending: false }).limit(5);
    const ev = events ?? [];
    let num = 0, den = 0;
    ev.forEach((e, age) => { const w = Math.max(0.05, e.confidence) * Math.pow(0.7, age); num += w * e.score; den += w; });
    const mastery = den ? num / den : score;
    const { count } = await db.from("skill_assessment_events").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("skill_id", row.id);
    const n = count ?? ev.length;
    const avgConf = ev.reduce((s, e) => s + e.confidence, 0) / Math.max(1, ev.length);
    await db.from("skill_mastery").upsert({
      student_id: userId, skill_id: row.id, mastery_score: mastery,
      confidence_score: Math.min(1, n / 4) * avgConf,
      status: levelFor(mastery, n, ev.slice(0, 3).map((e) => e.score)),
      attempt_count: n, last_assessed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,skill_id" });
  }

  for (const [crit, c] of Object.entries(a.criteria)) {
    for (const e of c.evidence) {
      const desc = e.issue.trim().toLowerCase().slice(0, 200);
      if (!desc) continue;
      const { data: old } = await db.from("mistake_journal").select("id, occurrence_count").eq("student_id", userId).eq("normalized_description", desc).maybeSingle();
      if (old) {
        await db.from("mistake_journal").update({ occurrence_count: old.occurrence_count + 1, last_seen_at: new Date().toISOString(), status: "open" }).eq("id", old.id);
      } else {
        await db.from("mistake_journal").insert({ student_id: userId, error_type: LABELS[crit], normalized_description: desc });
      }
    }
  }

  // Next step: the skill with the lowest current mastery.
  const { data: weak } = await db.from("skill_mastery").select("skill_id, mastery_score, attempt_count").eq("student_id", userId).order("mastery_score", { ascending: true }).limit(1);
  await db.from("learning_actions").update({ status: "superseded" }).eq("student_id", userId).eq("status", "pending");
  const w = weak?.[0];
  if (w) {
    const row = (skills ?? []).find((x) => x.id === w.skill_id);
    const s = row ? skillByCode(row.code) : undefined;
    await db.from("learning_actions").insert({
      student_id: userId, skill_id: w.skill_id, action_type: "practice_essay", priority: 1,
      reason_json: {
        title: `Focus: ${s?.name ?? row?.name}`, skill_code: row?.code,
        why: s?.tip ?? "This skill has the most room to grow right now.",
        expected: s?.practice ?? "Write a new essay on a different topic and focus on this skill.",
      },
    });
  }
}
