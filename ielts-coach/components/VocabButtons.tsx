"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SaveWord({ term, meaning, example }: { term: string; meaning: string; example: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "duplicate" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setState("saving"); setMessage("");
    try {
      const res = await fetch("/api/vocabulary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ term, meaning, example }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setState("error"); setMessage(j.error ?? `Could not save (${res.status}).`); return; }
      setState(j.duplicate ? "duplicate" : "saved");
      router.refresh(); // drop cached pages so the Vocabulary Bank shows the new word
    } catch { setState("error"); setMessage("No connection. Please try again."); }
  }

  const done = state === "saved" || state === "duplicate";
  return (
    <div style={{ textAlign: "right" }}>
      <button className="btn ghost" onClick={save} disabled={done || state === "saving"}>
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "duplicate" ? "Already saved ✓" : state === "error" ? "Try again" : "Save"}
      </button>
      {done && <div><small><Link href="/vocabulary">Open Vocabulary Bank →</Link></small></div>}
      {state === "error" && <div role="alert" style={{ color: "crimson" }}><small>{message}</small></div>}
    </div>
  );
}
