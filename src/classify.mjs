import { mentions, WORLDWIDE, WORLDWIDE_HIRING } from "./eligibility.mjs";

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

export function htmlToText(html = "") {
  return decode(decode(html).replace(/<(br|\/p|\/li|\/h\d|\/div)\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

const RESTRICT = [
  /(must|need to|required to|should)\s+(be\s+)?(located|based|reside|residing|living|live)\s+(in|within)\s+[^.\n]{2,80}/i,
  /(must|need to)\s+be\s+(legally\s+)?(authorized|eligible|permitted)\s+to\s+work\s+in\s+[^.\n]{2,60}/i,
  /(only\s+)?(open|available)\s+to\s+(candidates|applicants|residents)\s+(located\s+)?in\s+[^.\n]{2,80}/i,
];
const SPONSOR_NO = /(unable|not able)\s+to\s+(offer|provide)\s+(visa\s+)?sponsorship|\bno\s+(visa\s+)?sponsorship|without\s+(visa\s+)?sponsorship/i;
const SPONSOR_YES = /(visa|relocation)\s+sponsorship\s+(is\s+)?(available|provided|offered)|we\s+(offer|provide)\s+(visa|relocation)/i;

// The sentence of `text` that contains the first match of `re`.
export function sentenceWith(text, re) {
  const m = text.match(re);
  if (!m) return null;
  const i = m.index;
  const start = Math.max(text.lastIndexOf("\n", i), text.lastIndexOf(". ", i) + 1, 0);
  let end = text.indexOf("\n", i + m[0].length);
  const dot = text.indexOf(". ", i + m[0].length);
  if (end === -1 || (dot !== -1 && dot < end)) end = dot === -1 ? Math.min(text.length, i + m[0].length + 80) : dot + 1;
  return text.slice(start, end).trim().slice(0, 300);
}

// Deterministic baseline classifier. Output shape matches the LLM classifier (llm.mjs).
export function heuristicClassify(job) {
  const loc = job.location || "";
  const text = job.text || "";
  const remote = /remote/i.test(loc) || /remote/i.test(job.title || "");
  const c = { remote, scope: "unknown", countries: [], groups: [], conflict: false, quote: "", sponsorship: "unknown" };
  if (!remote) return c;

  const fromLoc = mentions(loc);
  if (WORLDWIDE.test(loc)) {
    c.scope = "worldwide"; c.quote = loc;
  } else if (fromLoc.countries.length || fromLoc.groups.length) {
    c.scope = "limited"; c.countries = fromLoc.countries; c.groups = fromLoc.groups; c.quote = loc;
  }

  // The description can narrow or contradict the headline location.
  const restriction = RESTRICT.map((re) => sentenceWith(text, re)).find(Boolean);
  if (restriction) {
    const m = mentions(restriction);
    if (m.countries.length || m.groups.length) {
      const sameAsLoc = m.countries.every((x) => c.countries.includes(x)) && m.groups.every((x) => c.groups.includes(x));
      if (c.scope === "worldwide") { c.conflict = true; c.quote = restriction; }
      else if (c.scope === "unknown") { c.scope = "limited"; c.countries = m.countries; c.groups = m.groups; c.quote = restriction; }
      else if (!sameAsLoc) { c.conflict = true; c.quote = restriction; }
    }
  }
  if (c.scope === "unknown" && WORLDWIDE_HIRING.test(text)) {
    const q = sentenceWith(text, WORLDWIDE_HIRING);
    // Precision first: a generic "we hire around the world" line is company boilerplate, not this role's rule.
    // Only the location field can make a role "worldwide"; the description alone leaves it UNCLEAR.
    if (q) c.quote = "";
  }
  // A country in the TITLE ("Account Executive, Poland") limits the role regardless of the generic location.
  const t = mentions(job.title || "");
  if (c.scope === "worldwide" && (t.countries.length || t.groups.length)) { c.scope = "limited"; c.countries = t.countries; c.groups = t.groups; c.quote = loc; c.conflict = true; }
  if (SPONSOR_NO.test(text)) c.sponsorship = "no";
  else if (SPONSOR_YES.test(text)) c.sponsorship = "yes";
  return c;
}

// The quote must appear verbatim in what the classifier was shown. Anything else is untrusted.
export function verifyQuote(constraints, job) {
  if (!constraints.remote || constraints.scope === "unknown") return constraints;
  const source = `${job.location || ""}\n${job.text || ""}`;
  if (constraints.quote && source.includes(constraints.quote)) return constraints;
  return { ...constraints, scope: "unknown", countries: [], groups: [], conflict: false, quote: "" };
}
