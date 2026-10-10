import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { avgBand } from "@/components/AssessmentView";
import { STATUS_RU } from "@/lib/learning";
import type { Assessment } from "@/lib/assess";

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: last }, { data: action }, { data: mastery }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("submissions").select("id, submitted_at, assessments(scores_json)").eq("student_id", user.id).eq("status", "assessed").order("submitted_at", { ascending: false }).limit(1),
    supabase.from("learning_actions").select("reason_json").eq("student_id", user.id).eq("status", "pending").order("priority").limit(1),
    supabase.from("skill_mastery").select("mastery_score, status, skills(code, name)").eq("student_id", user.id).order("mastery_score").limit(4),
  ]);
  const a = last?.[0]?.assessments?.[0]?.scores_json as Assessment | undefined;
  const next = action?.[0]?.reason_json as { title: string; why: string; expected: string } | undefined;
  return (
    <>
      <h1>Привет, {profile?.display_name ?? "студент"}</h1>
      <div className="card">
        <b>Следующий шаг</b>
        {next ? (<><p><b>{next.title}</b></p><p className="muted">{next.why}</p><p className="muted">{next.expected}</p></>)
          : <p className="muted">Пока нет работ. Напишите диагностическое эссе — система определит приоритетный навык.</p>}
        <Link className="btn" href="/writing/new">Написать эссе</Link>
      </div>
      {a && last && <div className="card"><b>Последняя работа</b><p>Примерный band: <span className="band">{avgBand(a).toFixed(1)}</span> · <Link href={`/writing/${last[0].id}`}>открыть разбор</Link></p></div>}
      {mastery && mastery.length > 0 && (
        <div className="card"><b>Слабые навыки</b>
          {mastery.map((m: any, i: number) => <p key={i}>{m.skills?.code} {m.skills?.name} — <span className="muted">{STATUS_RU[m.status] ?? m.status}, {(m.mastery_score * 100).toFixed(0)}%</span></p>)}
        </div>
      )}
    </>
  );
}
