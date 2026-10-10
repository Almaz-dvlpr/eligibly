"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Word = { id: string; term: string; meaning: string | null; example: string | null };

export default function VocabManager({ words }: { words: Word[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/vocabulary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ term, meaning }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { setTerm(""); setMeaning(""); if (j.duplicate) setError("This word is already in your bank."); router.refresh(); } else setError(j.error ?? "Error");
  }
  async function remove(id: string) {
    await fetch("/api/vocabulary", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }
  return (
    <>
      <form onSubmit={add} className="card">
        <div className="grid">
          <div><label htmlFor="t">Word or phrase</label><input id="t" value={term} onChange={(e) => setTerm(e.target.value)} maxLength={80} required /></div>
          <div><label htmlFor="m">Meaning / note (optional)</label><input id="m" value={meaning} onChange={(e) => setMeaning(e.target.value)} maxLength={300} /></div>
        </div>
        <p><button className="btn">Add to my bank</button></p>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      </form>
      {words.length === 0 ? <p className="muted">Your bank is empty. Save useful words from your essay feedback or add your own.</p> : (
        <table>
          <thead><tr><th>Word</th><th>Meaning</th><th></th></tr></thead>
          <tbody>{words.map((w) => (
            <tr key={w.id}><td><b>{w.term}</b>{w.example && <div className="muted"><small>{w.example}</small></div>}</td><td>{w.meaning}</td>
              <td><button className="link" onClick={() => remove(w.id)} aria-label={`Remove ${w.term}`}>Remove</button></td></tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
}
