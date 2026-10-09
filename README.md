# Eligibly

Remote jobs that are actually open to your country. Eligibly reads public job postings, turns the hiring rules into structured constraints, shows a YES / UNCLEAR / NO verdict per candidate country with the quoted sentence that proves it, and prepares an application pack. It stops at Apply: it never contacts employers or tracks replies.

Status: working prototype. See `docs/APPLICATION.md` (Claude for Startups draft) and `docs/VALIDATION.md` (14-day plan to get real evidence).

## Run it

Requires Node 20+. No dependencies.

```bash
npm run refresh   # fetch public Greenhouse boards, classify, write site/data.json
npm test          # 16 tests
npm run serve     # demo at http://localhost:4173
```

Optional LLM pass for postings the rules cannot decide: set `ANTHROPIC_API_KEY` before `npm run build`. Model defaults to `claude-haiku-5-5` (`ELIGIBLY_MODEL` overrides it). The LLM path is unit-tested with a mocked API but has not been run against the live API yet.

## How verdicts work

- `src/classify.mjs` turns a posting into constraints: `scope` (worldwide / limited / unknown), countries, regions, conflict flag, sponsorship, and a quote.
- `src/eligibility.mjs` computes a candidate's verdict from those constraints. It is shared with the browser so the demo and the build agree.
- Precision first: no verbatim quote means no YES. A generic "we hire worldwide" line in a company blurb is not a rule for the role. A country in the title limits the role. "Georgia" alone is treated as the US state.
- Region wording that may not include a country (for example EMEA and Kazakhstan) gives UNCLEAR, not YES.

## Decisions from the engineering review (docs/DESIGN.md)

- Auto-submit is deferred until 3 of 10 concierge users ask for it.
- Architecture target for the real product: Next.js on Vercel plus Supabase plus a jobs table, not a pile of separate services.
- Polling is polite: one request at a time, backoff on 429 and 5xx. Read each vendor's terms before widening the board list.
- Classifier accuracy is checked weekly on a hand-labelled gold set (not built yet).

## Known limits

- Rule-based classifier, not yet measured against hand-labelled data. Treat verdicts as a prototype.
- Greenhouse boards only; 30 companies; mostly US tech employers, so non-US YES counts are low by construction.
- No accounts, no CV tailoring yet, no payments.
