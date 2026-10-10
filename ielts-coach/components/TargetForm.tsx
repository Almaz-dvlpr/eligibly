"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TargetForm({ value }: { value: number }) {
  const router = useRouter();
  const [v, setV] = useState(String(value));
  const [saved, setSaved] = useState(false);
  async function save(next: string) {
    setV(next); setSaved(false);
    const res = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target_band: Number(next) }) });
    if (res.ok) { setSaved(true); router.refresh(); }
  }
  return (
    <label style={{ margin: 0 }}>
      <small className="muted">Change target {saved && "✓ saved"}</small>
      <select value={v} onChange={(e) => save(e.target.value)} aria-label="Target band">
        {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
      </select>
    </label>
  );
}
