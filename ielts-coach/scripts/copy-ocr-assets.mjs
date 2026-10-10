// Self-hosts the OCR engine and PDF worker (no CDN at runtime). Runs on install; output is git-ignored.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url).pathname;
const out = join(root, "public");
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));

try {
  mkdirSync(join(out, "tesseract"), { recursive: true });
  mkdirSync(join(out, "pdfjs"), { recursive: true });
  const tess = pkgDir("tesseract.js");
  cpSync(join(tess, "dist/worker.min.js"), join(out, "tesseract/worker.min.js"));
  const core = pkgDir("tesseract.js-core");
  for (const f of readdirSync(core)) if (/^tesseract-core.*lstm.*\.(js|wasm)$/.test(f)) cpSync(join(core, f), join(out, "tesseract", f));
  const lang = join(pkgDir("@tesseract.js-data/eng"), "4.0.0_best_int/eng.traineddata.gz");
  if (!existsSync(lang)) throw new Error("eng.traineddata.gz not found");
  cpSync(lang, join(out, "tesseract/eng.traineddata.gz"));
  cpSync(join(pkgDir("pdfjs-dist"), "legacy/build/pdf.worker.min.mjs"), join(out, "pdfjs/pdf.worker.min.mjs"));
  console.log("OCR assets copied to public/");
} catch (e) {
  console.warn("OCR assets not copied:", e.message); // do not fail installs; the attach feature degrades to text/markdown only
}
