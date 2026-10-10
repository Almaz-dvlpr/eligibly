"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Assessment } from "@/lib/assess";
import type { Topic } from "@/lib/topics";
import { QTYPE_LABEL } from "@/lib/topics";
import AssessmentView from "./AssessmentView";

export default function EssayForm({ topics, initialTopic, initialQ }: { topics: Topic[]; initialTopic: number; initialQ: number }) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(initialTopic);
  const [qn, setQn] = useState(initialQ);
  const [essay, setEssay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState<Assessment | null>(null);

  const topic = topics.find((t) => t.id === topicId)!;
  const question = topic.questions.find((q) => q.n === qn) ?? topic.questions[0];
  const key = `draft:${topic.id}:${question.n}`;

  useEffect(() => { try { setEssay(localStorage.getItem(key) ?? ""); } catch { setEssay(""); } }, [key]);
  useEffect(() => { try { if (essay) localStorage.setItem(key, essay); } catch {} }, [essay, key]);

  const words = essay.trim().split(/\s+/).filter(Boolean).length;

  function random() {
    const t = topics[Math.floor(Math.random() * topics.length)];
    setTopicId(t.id); setQn(t.questions[Math.floor(Math.random() * 5)].n);
  }

  async function submit() {
    setBusy(true); setError(""); setDemo(null);
    try {
      const res = await fetch("/api/assess", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: question.text, essay }) });
      const data = await res.json().catch(() => ({ error: res.status === 504 || res.status === 408 ? "The check took too long. Please try again." : `Server error (${res.status}). Please try again.` }));
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else if (data.demo) setDemo(data.assessment);
      else { try { localStorage.removeItem(key); } catch {} router.push(`/writing/${data.id}`); }
    } catch { setError("No connection. Your draft is saved in this browser."); }
    setBusy(false);
  }

  return (
    <>
      <h1>New essay</h1>
      <div className="grid wide">
        <div>
          <label htmlFor="topic">Topic (52)</label>
          <select id="topic" value={topicId} onChange={(e) => { setTopicId(Number(e.target.value)); setQn(1); }}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.id}. {t.en} — {t.ru}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "end" }}><button type="button" className="btn ghost" onClick={random}>Surprise me</button></div>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "8px 0" }}>
        <legend className="muted" style={{ padding: 0 }}>Choose one of 5 questions</legend>
        {topic.questions.map((q) => (
          <label key={q.n} className={`qopt${q.n === question.n ? " on" : ""}`}>
            <input type="radio" name="q" checked={q.n === question.n} onChange={() => setQn(q.n)} />
            <span>{q.text}<br /><small className="muted">{QTYPE_LABEL[q.type]}</small></span>
          </label>
        ))}
      </fieldset>

      <label htmlFor="essay">Your essay</label>
      <textarea id="essay" rows={16} value={essay} onChange={(e) => setEssay(e.target.value)} placeholder="Write at least 250 words…" />
      <p className="muted">{words} words {words < 250 ? `· aim for 250+ (${Math.max(0, 250 - words)} to go)` : "· great length"} · draft saved in this browser</p>
      <button className="btn" disabled={busy || words < 50} onClick={submit}>{busy ? "Checking…" : "Get feedback"}</button>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {demo && (<><p className="card">Demo mode: AI or database is not configured, so these numbers are placeholders and nothing is saved.</p><AssessmentView a={demo} canSave={false} /></>)}
    </>
  );
}
