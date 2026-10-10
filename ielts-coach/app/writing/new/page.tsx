"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Assessment } from "@/lib/assess";
import AssessmentView from "@/components/AssessmentView";

const PROMPT = "Some people think university education should be free for everyone. To what extent do you agree or disagree?";
export default function NewEssay() {
  const [essay, setEssay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [demo, setDemo] = useState<Assessment | null>(null);

  useEffect(() => { try { setEssay(localStorage.getItem("draft") ?? ""); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("draft", essay); } catch {} }, [essay]);

  const words = essay.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    setBusy(true); setError(""); setDemo(null);
    try {
      const res = await fetch("/api/assess", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: PROMPT, essay }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Ошибка");
      else if (data.demo) setDemo(data.assessment);
      else { try { localStorage.removeItem("draft"); } catch {} router.push(`/writing/${data.id}`); }
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
      {demo && (
        <>
          <p className="card">Демо-режим: ИИ или база не настроены, оценки ненастоящие и не сохраняются.</p>
          <AssessmentView a={demo} />
        </>
      )}
    </>
  );
}
