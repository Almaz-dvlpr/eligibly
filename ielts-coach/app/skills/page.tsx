import { requireUser } from "@/lib/supabase/server";
import { STATUS_RU } from "@/lib/learning";

export default async function Skills() {
  const { supabase, user } = await requireUser();
  const [{ data: skills }, { data: mastery }] = await Promise.all([
    supabase.from("skills").select("id, code, name, criterion, description").order("code"),
    supabase.from("skill_mastery").select("skill_id, mastery_score, status, attempt_count").eq("student_id", user.id),
  ]);
  const m = new Map((mastery ?? []).map((x) => [x.skill_id, x]));
  return (
    <>
      <h1>Карта навыков</h1>
      <p className="muted">«Освоение» — внутренняя оценка системы, не балл IELTS. Статус «устойчиво» нужен минимум 3 подтверждённых проверки.</p>
      <div className="grid">
        {(skills ?? []).map((s) => {
          const x = m.get(s.id);
          return (
            <div className="card" key={s.id}>
              <small className="muted">{s.code} · {s.criterion}</small>
              <div><b>{s.name}</b></div>
              <p className="muted">{s.description}</p>
              <p>{x ? `${STATUS_RU[x.status] ?? x.status} · ${(x.mastery_score * 100).toFixed(0)}% · попыток: ${x.attempt_count}` : STATUS_RU.unassessed}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
