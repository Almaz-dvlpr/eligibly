// Polite ingestion from the PUBLIC Greenhouse job-board API (no scraping, no login).
// One request at a time, backoff on 429/5xx (design decision D3). Check Greenhouse's current
// terms before pointing this at more than a demo list of boards.
import { writeFile, mkdir } from "node:fs/promises";
import { htmlToText } from "./classify.mjs";

export const BOARDS = ["gitlab", "cloudflare", "coinbase", "datadog", "figma", "discord", "reddit", "twilio", "dropbox", "instacart", "databricks", "stripe", "okta", "asana", "mongodb", "airtable", "robinhood", "gusto", "samsara", "anthropic", "elastic", "canonical", "remotecom", "grafanalabs", "mozilla", "wikimedia", "bitwarden", "netlify", "vercel", "mixpanel"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "user-agent": "EligiblyBot/0.1 (job eligibility research)" } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(1000 * 2 ** i); continue; }
    return null;
  }
  return null;
}

const jobs = [];
const failed = [];
for (const token of BOARDS) {
  const data = await get(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
  if (!data || !data.jobs) { failed.push(token); await sleep(300); continue; }
  for (const j of data.jobs) {
    jobs.push({
      id: `gh-${token}-${j.id}`, company: token, title: j.title, location: (j.location && j.location.name) || "",
      url: j.absolute_url, updated_at: j.updated_at, text: htmlToText(j.content).slice(0, 6000),
    });
  }
  await sleep(300);
}
await mkdir("data", { recursive: true });
await writeFile("data/raw.json", JSON.stringify({ fetched_at: new Date().toISOString(), jobs }));
console.log(`ingested ${jobs.length} jobs from ${BOARDS.length - failed.length} boards; skipped: ${failed.join(", ") || "none"}`);
