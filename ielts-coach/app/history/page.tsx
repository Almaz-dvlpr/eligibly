import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { avgBand } from "@/components/AssessmentView";
import type { Assessment } from "@/lib/assess";

export default async function History() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("submissions").select("id, submitted_at, word_count, status, task_prompt, assessments(scores_json)").eq("student_id", user.id).order("submitted_at", { ascending: false });
  return (
    <>
      <h1>История работ</h1>
      {!data?.length ? <p className="muted">Работ пока нет. <Link href="/writing/new">Написать эссе</Link></p> : (
        <table>
          <thead><tr><th>Дата</th><th>Тема</th><th>Слов</th><th>Band</th></tr></thead>
          <tbody>
            {data.map((s: any) => {
              const a = s.assessments?.[0]?.scores_json as Assessment | undefined;
              return (
                <tr key={s.id}>
                  <td><Link href={`/writing/${s.id}`}>{new Date(s.submitted_at).toLocaleDateString("ru-RU")}</Link></td>
                  <td>{s.task_prompt.slice(0, 50)}…</td><td>{s.word_count}</td>
                  <td>{a ? avgBand(a).toFixed(1) : s.status === "failed" ? "ошибка проверки" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
