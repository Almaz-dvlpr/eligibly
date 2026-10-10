"use client";
import { useEffect, useRef, useState } from "react";
import { importFile } from "@/lib/importFile";

export default function FileImport({ current, onText }: { current: string; onText: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [serverOcr, setServerOcr] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, setPending] = useState<{ text: string; confidence: number } | null>(null);

  useEffect(() => {
    fetch("/api/ocr").then((r) => r.json()).then((j) => { setServerOcr(!!j.enabled); setProvider(j.provider ?? null); }).catch(() => {});
  }, []);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (current.trim() && !window.confirm("Replace the text in the editor with the text from this file?")) return;
    setBusy(true); setError(""); setNotes([]); setPending(null); setStatus("Working…");
    try {
      const r = await importFile(file, { serverOcr, onProgress: setStatus });
      if (!r.text.trim()) throw new Error("No readable text was found in this file.");
      if (r.method === "ocr" && r.confidence !== undefined && r.confidence < 60) {
        // Do not put unreadable text into the editor: it would be assessed as the student's own writing.
        setPending({ text: r.text, confidence: Math.round(r.confidence) });
        setStatus("");
        setBusy(false);
        return;
      }
      onText(r.text);
      const how = r.method === "text" ? "Text loaded" : r.method === "pdf-text" ? "Text read from PDF" : "Text recognised from image";
      setStatus(`${how}: ${r.source}`);
      setNotes([...r.warnings, ...(r.method === "text" || r.method === "pdf-text" ? [] : ["Recognition can make mistakes, and spelling mistakes will be assessed. Please check the text and the paragraph breaks before sending."])]);
    } catch (err) {
      setStatus(""); setError(err instanceof Error ? err.message : "Could not read this file.");
    }
    setBusy(false);
  }

  return (
    <div className="card" style={{ margin: "12px 0" }}>
      <b>Attach a file</b> <small className="muted">photo, PDF, .md or .txt</small>
      <p className="muted" style={{ margin: ".3em 0" }}><small>
        Photos and scans are read {serverOcr ? `by an AI reading service (${provider ?? "AI"}; the image is sent to it)` : "on your device, nothing is uploaded; handwriting is not supported in this mode"}. The text appears in the editor so you can correct it before checking.
      </small></p>
      <input ref={input} type="file" hidden accept="image/*,.pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown" onChange={pick} data-testid="file-input" />
      <button type="button" className="btn ghost" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Working…" : "Choose file"}</button>
      {status && <p className="muted" role="status" style={{ margin: ".5em 0 0" }}>{status}</p>}
      {pending && (
        <div role="alert" className="panel focus" style={{ marginTop: 10 }}>
          <b>This looks like handwriting that the built-in reader cannot read reliably ({pending.confidence}% confidence).</b>
          <p style={{ margin: ".4em 0" }}>
            {serverOcr ? "Please try a clearer, well-lit photo." : "AI image reading is not switched on for this site. You can type the essay instead, or ask the site owner to enable AI reading (it handles handwriting)."}
          </p>
          <button type="button" className="btn ghost" onClick={() => { onText(pending.text); setNotes(["Inserted anyway. Expect many mistakes; please correct every line."]); setStatus("Text inserted from image"); setPending(null); }}>Insert anyway</button>
        </div>
      )}
      {error && <p role="alert" style={{ color: "crimson", margin: ".5em 0 0" }}>{error}</p>}
      {notes.map((n, i) => <p key={i} className="muted" style={{ margin: ".3em 0 0" }}><small>⚠ {n}</small></p>)}
    </div>
  );
}
