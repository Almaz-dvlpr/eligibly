import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assessment } from "./assess";
import { CRITERION_SKILL, LABELS } from "./criteria";

export const STATUS_RU: Record<string, string> = {
  unassessed: "не проверен",
  needs_practice: "нужна практика",
  developing: "развивается",
  stable: "устойчиво",
};

/** Updates mastery, mistake journal and the next learning action after an assessment. */
export async function applyAssessment(db: SupabaseClient, userId: string, a: Assessment) {
  const { data: skills } = await db.from("skills").select("id, code, name");
  const byCode = new Map((skills ?? []).map((s) => [s.code as string, s]));

  for (const ev of a.skill_evidence) {
    const skill = byCode.get(ev.skill_code);
    if (!skill || ev.evidence_status === "insufficient_data") continue;
    const target = ev.evidence_status === "ok" ? 0.8 : 0.3;
    const { data: old } = await db.from("skill_mastery").select("*").eq("student_id", userId).eq("skill_id", skill.id).maybeSingle();
    const attempts = (old?.attempt_count ?? 0) + 1;
    const score = old ? 0.6 * old.mastery_score + 0.4 * target : target;
    // One good answer is never "stable": needs >= 3 attempts and score >= 0.75.
    const status = score < 0.5 ? "needs_practice" : attempts >= 3 && score >= 0.75 ? "stable" : "developing";
    await db.from("skill_mastery").upsert({
      student_id: userId, skill_id: skill.id, mastery_score: score, confidence_score: ev.confidence,
      status, attempt_count: attempts, last_assessed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,skill_id" });
  }

  for (const [crit, c] of Object.entries(a.criteria)) {
    const skill = byCode.get(CRITERION_SKILL[crit]);
    for (const e of c.evidence) {
      const desc = e.issue.trim().toLowerCase().slice(0, 200);
      if (!desc) continue;
      const { data: old } = await db.from("mistake_journal").select("id, occurrence_count").eq("student_id", userId).eq("normalized_description", desc).maybeSingle();
      if (old) {
        await db.from("mistake_journal").update({ occurrence_count: old.occurrence_count + 1, last_seen_at: new Date().toISOString(), status: "open" }).eq("id", old.id);
      } else {
        await db.from("mistake_journal").insert({ student_id: userId, skill_id: skill?.id, error_type: LABELS[crit], normalized_description: desc });
      }
    }
  }

  // Next action: weakest assessed skill.
  const { data: weak } = await db.from("skill_mastery").select("skill_id, mastery_score, attempt_count, status").eq("student_id", userId).neq("status", "stable").order("mastery_score", { ascending: true }).limit(1);
  await db.from("learning_actions").update({ status: "superseded" }).eq("student_id", userId).eq("status", "pending");
  if (weak?.[0]) {
    const s = (skills ?? []).find((x) => x.id === weak[0].skill_id);
    await db.from("learning_actions").insert({
      student_id: userId, skill_id: weak[0].skill_id, action_type: "practice_essay", priority: 1,
      reason_json: {
        title: `Практика: ${s?.name ?? "навык"}`,
        why: `Навык «${s?.name}» — самый слабый по результатам последних проверок (оценка ${(weak[0].mastery_score * 100).toFixed(0)}%, попыток: ${weak[0].attempt_count}).`,
        expected: "Напишите новое эссе на другую тему, уделяя внимание этому навыку. Повторная проверка подтвердит или не подтвердит прогресс.",
      },
    });
  }
}
