"use client";
import { useEffect, useRef, useState } from "react";
import { combineTexts, importFile, type ImportResult } from "@/lib/importFile";

type Item = { id: number; file: File; thumb?: string; state: "waiting" | "working" | "done" | "error"; msg?: string };
const ACCEPT = "image/*,.pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown";
const MAX_FILES = 12;
const MAX_TOTAL = 40 * 1024 * 1024;
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
let nextId = 1;

export default function FileImport({ current, onText }: { current: string; onText: (text: string) => void }) {
  const pick = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [serverOcr, setServerOcr] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState<"append" | "replace">("replace");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, setPending] = useState<{ text: string; confidence: number } | null>(null);
  const urls = useRef<string[]>([]);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    fetch("/api/ocr").then((r) => r.json()).then((j) => { setServerOcr(!!j.enabled); setProvider(j.provider ?? null); if (j.limit) setLimit(j.limit); }).catch(() => {});
    return () => urls.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const update = (id: number, patch: Partial<Item>) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  function add(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list); // copy now: the input is cleared right after this call and a FileList is live
    const cur = itemsRef.current;
    const room = MAX_FILES - cur.length;
    let err = incoming.length > room ? `You can add up to ${MAX_FILES} files at a time.` : "";
    let total = cur.reduce((s, x) => s + x.file.size, 0);
    const added: Item[] = [];
    for (const f of incoming.slice(0, Math.max(0, room))) {
      if (total + f.size > MAX_TOTAL) { err = "The files are too large together (max 40 MB)."; break; }
      total += f.size;
      const thumb = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      if (thumb) urls.current.push(thumb);
      added.push({ id: nextId++, file: f, thumb, state: "waiting" });
    }
    setError(err); setPending(null);
    setItems([...cur, ...added]);
  }

  const remove = (id: number) => setItems((l) => l.filter((x) => x.id !== id));
  const move = (i: number, d: -1 | 1) => setItems((l) => { const a = [...l], j = i + d; if (j < 0 || j >= a.length) return l; [a[i], a[j]] = [a[j], a[i]]; return a; });

  function apply(text: string, extra: string[]) {
    onText(mode === "append" && current.trim() ? `${current.trim()}\n\n${text}` : text);
    setNotes(extra);
  }

  async function proceed() {
    setBusy(true); setError(""); setNotes([]); setPending(null);
    const queue = items.filter((x) => x.state !== "done");
    const results: ImportResult[] = []; const warn: string[] = []; const okIds: number[] = [];
    for (let i = 0; i < queue.length; i++) {
      const it = queue[i];
      update(it.id, { state: "working", msg: "" });
      try {
        const r = await importFile(it.file, { serverOcr, onProgress: (m) => setStatus(queue.length > 1 ? `File ${i + 1} of ${queue.length}: ${m}` : m) });
        if (!r.text.trim()) throw new Error("No readable text found.");
        results.push(r); okIds.push(it.id);
        update(it.id, { state: "done", msg: `${words(r.text)} words` });
        r.warnings.forEach((w) => warn.push(queue.length > 1 ? `${it.file.name}: ${w}` : w));
      } catch (e) {
        update(it.id, { state: "error", msg: e instanceof Error ? e.message : "Could not read this file." });
      }
    }
    setStatus("");
    if (!results.length) { setError("Nothing could be read. Remove the files marked in red or try other ones."); setBusy(false); return; }

    const text = combineTexts(results.map((r) => r.text));
    const extra = [...new Set(warn)];
    if (results.length > 1) extra.push("Pages were joined in the order shown. Please check the paragraph breaks.");
    const recognised = results.some((r) => r.method === "ocr" || r.method === "server-ocr");
    if (recognised) extra.push("Recognition can make mistakes, and spelling mistakes will be assessed. Please check the text before sending.");
    const low = results.filter((r) => r.method === "ocr" && r.confidence !== undefined && r.confidence < 60);

    if (low.length) {
      // Do not put unreadable text into the editor: it would be assessed as the student's own writing.
      setPending({ text, confidence: Math.round(Math.min(...low.map((r) => r.confidence!))) });
      setNotes(extra);
    } else {
      apply(text, extra);
      setStatus(`Text from ${results.length} file${results.length > 1 ? "s" : ""} is in the editor.`);
    }
    setItems((l) => l.filter((x) => !okIds.includes(x.id)));
    setBusy(false);
  }

  const hasImages = items.some((x) => x.file.type.startsWith("image/") || x.file.type === "application/pdf");
  const tile: React.CSSProperties = { border: "2px dashed var(--line)", borderRadius: 12, background: "transparent", color: "var(--primary)", font: "inherit", fontWeight: 600, padding: "10px 16px", cursor: "pointer" };

  return (
    <div className="card" style={{ margin: "12px 0" }}>
      <b>Attach files</b> <small className="muted">photos, PDF, .md or .txt · add as many pages as you need</small>
      <p className="muted" style={{ margin: ".3em 0 .6em" }}><small>
        Photos and scans are read {serverOcr ? `by an AI reading service (${provider ?? "AI"}; the images are sent to it${hasImages ? `; each photo uses one of your ${limit} daily readings` : ""})` : "on your device, nothing is uploaded; handwriting is not supported in this mode"}. The text appears in the editor so you can correct it before checking.
      </small></p>

      <input ref={pick} type="file" multiple hidden accept={ACCEPT} data-testid="file-input" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <input ref={cam} type="file" hidden accept="image/*" capture="environment" data-testid="camera-input" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />

      {items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px" }} aria-label="Files to read">
          {items.map((it, i) => (
            <li key={it.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              {it.thumb
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={it.thumb} alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 8, flex: "none" }} />
                : <span aria-hidden style={{ width: 48, height: 48, borderRadius: 8, background: "var(--growth-bg)", color: "var(--growth)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: ".75rem", flex: "none" }}>{(it.file.name.split(".").pop() ?? "").slice(0, 4).toUpperCase()}</span>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b>{i + 1}.</b> {it.file.name}</div>
                <small className="muted">{kb(it.file.size)}</small>{" "}
                {it.state === "working" && <small className="muted">· reading…</small>}
                {it.state === "done" && <small style={{ color: "var(--strength)" }}>· ✓ {it.msg}</small>}
                {it.state === "error" && <small role="alert" style={{ color: "crimson" }}>· {it.msg}</small>}
              </div>
              <div style={{ display: "flex", gap: 4, flex: "none" }}>
                <button type="button" className="link" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Move ${it.file.name} up`}>↑</button>
                <button type="button" className="link" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${it.file.name} down`}>↓</button>
                <button type="button" className="link" disabled={busy} onClick={() => remove(it.id)} aria-label={`Remove ${it.file.name}`}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={tile} disabled={busy || items.length >= MAX_FILES} onClick={() => pick.current?.click()}>{items.length ? "+ Add more files" : "+ Choose files"}</button>
        <button type="button" style={tile} disabled={busy || items.length >= MAX_FILES} onClick={() => cam.current?.click()}>📷 Take photo</button>
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {current.trim() && (
            <label style={{ display: "block", margin: "0 0 8px", fontWeight: 400 }}>
              <small className="muted">Text already in the editor:</small>{" "}
              <select value={mode} onChange={(e) => setMode(e.target.value as "append" | "replace")} style={{ width: "auto", padding: "4px 8px" }} aria-label="What to do with the text already in the editor">
                <option value="replace">Replace it</option>
                <option value="append">Add the new text after it</option>
              </select>
            </label>
          )}
          <button type="button" className="btn" disabled={busy || items.every((x) => x.state === "done")} onClick={proceed}>
            {busy ? "Reading…" : `Proceed (${items.filter((x) => x.state !== "done").length} file${items.filter((x) => x.state !== "done").length === 1 ? "" : "s"})`}
          </button>
        </div>
      )}

      {status && <p className="muted" role="status" style={{ margin: ".6em 0 0" }}>{status}</p>}
      {pending && (
        <div role="alert" className="panel focus" style={{ marginTop: 10 }}>
          <b>This looks like handwriting that the built-in reader cannot read reliably ({pending.confidence}% confidence).</b>
          <p style={{ margin: ".4em 0" }}>
            {serverOcr ? "Please try clearer, well-lit photos." : "AI image reading is not switched on for this site. You can type the essay instead, or ask the site owner to enable AI reading (it handles handwriting)."}
          </p>
          <button type="button" className="btn ghost" onClick={() => { apply(pending.text, ["Inserted anyway. Expect many mistakes; please correct every line."]); setStatus("Text inserted from images."); setPending(null); }}>Insert anyway</button>
        </div>
      )}
      {error && <p role="alert" style={{ color: "crimson", margin: ".6em 0 0" }}>{error}</p>}
      {notes.map((n, i) => <p key={i} className="muted" style={{ margin: ".3em 0 0" }}><small>⚠ {n}</small></p>)}
    </div>
  );
}
