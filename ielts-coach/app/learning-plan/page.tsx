import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { recommend, writeHref } from "@/lib/topics";

export default async function Plan() {
  const { supabase, user } = await requireUser();
  const [{ data }, { data: subs }] = await Promise.all([
    supabase.from("learning_actions").select("id, status, reason_json").eq("student_id", user.id).order("id", { ascending: false }).limit(20),
    supabase.from("submissions").select("task_prompt").eq("student_id", user.id),
  ]);
  const done = new Set((subs ?? []).map((s) => s.task_prompt as string));
  return (
    <>
      <h1>Personal Learning Plan</h1>
      {!data?.length ? <p className="muted">Your plan appears after your first checked essay. <Link href="/writing/new">Write an essay</Link></p> :
        data.map((a: any) => {
          const r = a.reason_json ?? {};
          const rec = a.status === "pending" && r.skill_code ? recommend(r.skill_code, done) : null;
          return (
            <div className={a.status === "pending" ? "panel focus" : "card"} key={a.id}>
              <b>{r.title}</b> <small className="muted">· {a.status === "pending" ? "current step" : "earlier step"}</small>
              <p className="muted">{r.why}</p>
              {a.status === "pending" && <p className="muted">{r.expected}</p>}
              {rec && <><p><small className="muted">Suggested question ({rec.topic.en}): {rec.q.text}</small></p><Link className="btn" href={writeHref(rec)}>Start focused practice</Link></>}
            </div>
          );
        })}
    </>
  );
}
