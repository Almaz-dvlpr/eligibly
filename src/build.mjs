import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { heuristicClassify, verifyQuote } from "./classify.mjs";
import { llmClassify } from "./llm.mjs";

const raw = JSON.parse(await readFile("data/raw.json", "utf8"));
const useLlm = !!process.env.ANTHROPIC_API_KEY;
const out = [];
let llmFailed = 0;
for (const job of raw.jobs) {
  if (!/remote/i.test(job.location) && !/remote/i.test(job.title)) continue; // cheap prefilter before any LLM call
  let c = verifyQuote(heuristicClassify(job), job);
  if (useLlm && (c.scope === "unknown" || c.conflict)) {
    try { c = await llmClassify(job); } catch { llmFailed++; }
  }
  out.push({ id: job.id, company: job.company, title: job.title, location: job.location, url: job.url, updated_at: job.updated_at, constraints: c });
}
await mkdir("site", { recursive: true });
await writeFile("site/data.json", JSON.stringify({ generated_at: raw.fetched_at, classifier: useLlm ? "heuristic+llm" : "heuristic", jobs: out }));
await copyFile("src/eligibility.mjs", "site/eligibility.mjs");
const by = out.reduce((a, j) => ((a[j.constraints.scope] = (a[j.constraints.scope] || 0) + 1), a), {});
console.log(`remote jobs: ${out.length} (${JSON.stringify(by)}); llm fallbacks failed: ${llmFailed}`);
