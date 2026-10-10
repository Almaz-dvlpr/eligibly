import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import AssessmentView from "@/components/AssessmentView";
import type { Assessment } from "@/lib/assess";

export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: s } = await supabase.from("submissions").select("id, task_prompt, essay_text, word_count, status, submitted_at, assessments(scores_json)").eq("id", id).maybeSingle();
  if (!s) notFound(); // RLS hides other people's essays
  const a = (s as any).assessments?.[0]?.scores_json as Assessment | undefined;
  return (
    <>
      <h1>Результат проверки</h1>
      <p className="muted">{s.task_prompt}</p>
      {a ? <AssessmentView a={a} /> : <p className="card">{s.status === "failed" ? "Проверка не удалась, но эссе сохранено." : "Проверка ещё выполняется."}</p>}
      <details className="card"><summary>Ваш текст ({s.word_count} слов)</summary><p style={{ whiteSpace: "pre-wrap" }}>{s.essay_text}</p></details>
      <p><Link href="/learning-plan">Что делать дальше →</Link></p>
    </>
  );
}
