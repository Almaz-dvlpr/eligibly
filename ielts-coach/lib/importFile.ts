// Client-side import of an essay from a file: text/markdown, PDF (text layer, or OCR for scans) or a photo (OCR).
export type ImportResult = { text: string; source: string; method: "text" | "pdf-text" | "ocr" | "server-ocr"; warnings: string[] };
type Progress = (msg: string) => void;

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_PDF_PAGES = 6;

/** Joins soft-wrapped lines into paragraphs: blank lines stay as paragraph breaks. */
export function tidy(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/(\w)-\n(\w)/g, "$1$2") // hyphenated line breaks
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\s*/, "") // front matter
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+.*$/gm, (h) => h) // keep headings text, drop marks below
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
    .replace(/`([^`]*)`/g, "$1");
}

type OcrWorker = { recognize(img: unknown): Promise<{ data: { text: string; confidence: number } }> };
let workerPromise: Promise<OcrWorker> | null = null;

async function localWorker(onProgress: Progress): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      onProgress("Loading text recogniser (first time only)…");
      const { createWorker } = await import("tesseract.js");
      return (await createWorker("eng", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract",
        langPath: "/tesseract",
        workerBlobURL: false,
        gzip: true,
      })) as unknown as OcrWorker;
    })().catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

async function toBlob(src: Blob | HTMLCanvasElement, maxSide: number): Promise<Blob> {
  const bmp = src instanceof Blob ? await createImageBitmap(src) : null;
  const w0 = bmp ? bmp.width : (src as HTMLCanvasElement).width;
  const h0 = bmp ? bmp.height : (src as HTMLCanvasElement).height;
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage((bmp ?? src) as CanvasImageSource, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.88));
}

async function serverOcr(blob: Blob): Promise<string> {
  const small = await toBlob(blob, 1800);
  const dataUrl: string = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(small); });
  const r = await fetch("/api/ocr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: dataUrl }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `OCR failed (${r.status})`);
  return j.text as string;
}

async function ocr(src: Blob | HTMLCanvasElement, useServer: boolean, onProgress: Progress, warnings: string[]): Promise<{ text: string; server: boolean }> {
  const blob = src instanceof Blob ? src : await new Promise<Blob>((res, rej) => src.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
  if (useServer) {
    onProgress("Reading the image…");
    return { text: await serverOcr(blob), server: true };
  }
  const worker = await localWorker(onProgress);
  onProgress("Recognising text…");
  const { data } = await worker.recognize(blob);
  if (data.confidence < 65) warnings.push(`Low recognition confidence (${Math.round(data.confidence)}%). Typed or printed text works best; please check every line.`);
  return { text: data.text, server: false };
}

async function pdfText(file: File, onProgress: Progress, useServer: boolean, warnings: string[]): Promise<ImportResult> {
  onProgress("Opening PDF…");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  if (doc.numPages > MAX_PDF_PAGES) warnings.push(`Only the first ${MAX_PDF_PAGES} pages were read.`);

  let text = "";
  for (let i = 1; i <= pages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let line = "";
    for (const it of content.items as { str?: string; hasEOL?: boolean }[]) {
      line += it.str ?? "";
      if (it.hasEOL) line += "\n";
    }
    text += line + "\n\n";
  }
  if (text.replace(/\s/g, "").length >= 80) return { text: tidy(text), source: file.name, method: "pdf-text", warnings };

  // No text layer: this PDF is a scan. Render each page and run OCR.
  let out = "", server = false;
  for (let i = 1; i <= pages; i++) {
    onProgress(`Recognising page ${i} of ${pages}…`);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
    const r = await ocr(canvas, useServer, onProgress, warnings);
    server = r.server; out += r.text + "\n\n";
  }
  warnings.push("This PDF is a scan, so the text was recognised from images.");
  return { text: tidy(out), source: file.name, method: server ? "server-ocr" : "ocr", warnings: [...new Set(warnings)] };
}

export async function importFile(file: File, opts: { serverOcr: boolean; onProgress: Progress }): Promise<ImportResult> {
  if (file.size > MAX_BYTES) throw new Error("File is too large (max 15 MB).");
  const name = file.name.toLowerCase();
  const warnings: string[] = [];

  if (/\.(md|markdown|txt)$/.test(name) || file.type === "text/plain" || file.type === "text/markdown") {
    const raw = await file.text();
    const text = tidy(/\.(md|markdown)$/.test(name) ? stripMarkdown(raw) : raw);
    return { text, source: file.name, method: "text", warnings };
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") return pdfText(file, opts.onProgress, opts.serverOcr, warnings);
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/.test(name)) {
    try { await createImageBitmap(file); } catch { throw new Error("This image format cannot be opened in the browser (HEIC?). Please save it as JPG or PNG."); }
    const r = await ocr(file, opts.serverOcr, opts.onProgress, warnings);
    if (!opts.serverOcr) warnings.push("Handwriting may be recognised poorly. Please check the text carefully.");
    return { text: tidy(r.text), source: file.name, method: r.server ? "server-ocr" : "ocr", warnings };
  }
  throw new Error("Unsupported file. Use a photo (JPG/PNG), PDF, or a .md/.txt file.");
}
