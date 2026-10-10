import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";

export default async function Plan() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("learning_actions").select("id, status, reason_json, due_at").eq("student_id", user.id).order("id", { ascending: false }).limit(20);
  return (
    <>
      <h1>Учебный план</h1>
      {!data?.length ? <p className="muted">План появится после первой проверки. <Link href="/writing/new">Написать эссе</Link></p> :
        data.map((a: any) => (
          <div className="card" key={a.id}>
            <b>{a.reason_json?.title}</b> <small className="muted">· {a.status === "pending" ? "актуально" : "заменено новым шагом"}</small>
            <p className="muted">{a.reason_json?.why}</p>
            {a.status === "pending" && <><p className="muted">{a.reason_json?.expected}</p><Link className="btn" href="/writing/new">Выполнить: новое эссе</Link></>}
          </div>
        ))}
    </>
  );
}
