"use client";
import { useState } from "react";

export function SaveWord({ term, meaning, example }: { term: string; meaning: string; example: string }) {
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  async function save() {
    const res = await fetch("/api/vocabulary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ term, meaning, example }) });
    setState(res.ok ? "saved" : "error");
  }
  return <button className="btn ghost" onClick={save} disabled={state === "saved"}>{state === "saved" ? "Saved ✓" : state === "error" ? "Try again" : "Save"}</button>;
}
