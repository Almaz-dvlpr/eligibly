import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import AssessmentView from "@/components/AssessmentView";
import type { Assessment } from "@/lib/assess";
import { SKILLS } from "@/lib/skills";
import { skillScore } from "@/lib/learning";
import { recommend, writeHref } from "@/lib/topics";

export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: s }, { data: subs }] = await Promise.all([
    supabase.from("submissions").select("id, task_prompt, essay_text, word_count, status, submitted_at, assessments(scores_json)").eq("id", id).maybeSingle(),
    supabase.from("submissions").select("task_prompt").eq("student_id", user.id),
  ]);
  if (!s) notFound(); // RLS hides other people's essays
  const a = (s as any).assessments?.[0]?.scores_json as Assessment | undefined;
  let practiceHref: string | undefined;
  if (a) {
    const lowest = [...SKILLS].sort((x, y) => skillScore(a, x.code).score - skillScore(a, y.code).score)[0];
    practiceHref = writeHref(recommend(lowest.code, new Set((subs ?? []).map((x) => x.task_prompt as string))));
  }
  return (
    <>
      <h1>Essay feedback</h1>
      <p className="muted">{s.task_prompt}</p>
      {a ? <AssessmentView a={a} practiceHref={practiceHref} /> : <p className="card">{s.status === "failed" ? "The check did not complete, but your essay is saved." : "Your essay is still being checked."}</p>}
      <details className="card"><summary>Your text ({s.word_count} words)</summary><p style={{ whiteSpace: "pre-wrap" }}>{s.essay_text}</p></details>
      <p><Link href="/learning-plan">What to do next →</Link></p>
    </>
  );
}
