import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { overall } from "@/lib/data";
import type { Assessment } from "@/lib/assess";

export default async function History() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("submissions").select("id, submitted_at, word_count, status, task_prompt, assessments(scores_json)").eq("student_id", user.id).order("submitted_at", { ascending: false });
  return (
    <>
      <h1>My Essays</h1>
      {!data?.length ? <p className="muted">No essays yet. <Link href="/writing/new">Write your first one</Link></p> : (
        <table>
          <thead><tr><th>Date</th><th>Question</th><th>Words</th><th>Est. band</th></tr></thead>
          <tbody>
            {data.map((s: any) => {
              const a = s.assessments?.[0]?.scores_json as Assessment | undefined;
              return (
                <tr key={s.id}>
                  <td><Link href={`/writing/${s.id}`}>{new Date(s.submitted_at).toLocaleDateString("en-GB")}</Link></td>
                  <td>{s.task_prompt.slice(0, 70)}…</td><td>{s.word_count}</td>
                  <td>{a ? overall(a).toFixed(1) : s.status === "failed" ? "check pending" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
