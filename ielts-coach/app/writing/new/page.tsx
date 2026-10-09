"use client";
import { useEffect, useState } from "react";
import type { Assessment } from "@/lib/assess";

const PROMPT = "Some people think university education should be free for everyone. To what extent do you agree or disagree?";
const LABELS: Record<string, string> = {
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammatical Range & Accuracy",
};

export default function NewEssay() {
  const [essay, setEssay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ demo: boolean; assessment: Assessment } | null>(null);

  useEffect(() => { try { setEssay(localStorage.getItem("draft") ?? ""); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("draft", essay); } catch {} }, [essay]);

  const words = essay.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/assess", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: PROMPT, essay }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Ошибка"); else setResult(data);
    } catch { setError("Нет соединения. Черновик сохранён."); }
    setBusy(false);
  }

  return (
    <>
      <h1>Новое эссе (Task 2)</h1>
      <div className="card"><b>Тема</b><p>{PROMPT}</p></div>
      <textarea rows={14} value={essay} onChange={(e) => setEssay(e.target.value)} placeholder="Write at least 250 words…" />
      <p className="muted">{words} слов · черновик сохраняется в браузере</p>
      <button className="btn" disabled={busy || words < 50} onClick={submit}>{busy ? "Проверяем…" : "Проверить"}</button>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {result && (
        <>
          {result.demo && <p className="card">Демо-режим: ключ ИИ не настроен, оценки ненастоящие.</p>}
          <div className="grid">
            {Object.entries(result.assessment.criteria).map(([k, c]) => (
              <div className="card" key={k}>
                <small className="muted">{LABELS[k]}</small>
                <div className="band">{c.estimated_band.toFixed(1)}</div>
                {c.evidence.map((e, i) => <p key={i}><q>{e.excerpt}</q><br /><b>{e.issue}.</b> {e.explanation}</p>)}
                {c.next_steps.map((s, i) => <p className="muted" key={i}>→ {s}</p>)}
              </div>
            ))}
          </div>
          {result.assessment.needs_teacher_review && <p className="muted">Рекомендуется проверка преподавателем.</p>}
        </>
      )}
    </>
  );
}
