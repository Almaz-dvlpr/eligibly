# Claude for Startups: application draft (Eligibly)

> **Check before you send.** I could not open Anthropic's official program page from here. Third-party guides disagree on credit amounts (about $1,000 to $5,000 direct, more via a VC or accelerator referral) and on eligibility (incorporated company, business email, company age or funding limits). Read the official page, then fix the fields below to match it. Do not copy a number from this file into the form without checking.
> Candidate official page, per third-party guides: claude.com/programs/startups.

## Before you apply: blockers to clear (in order)

1. **A legal entity or whatever the form accepts.** If the form asks for a registered company, register one first. If it accepts a sole founder, say so honestly.
2. **A public URL.** Deploy `site/` (static; works on Vercel, Netlify, Cloudflare Pages or GitHub Pages). Put the URL in the form.
3. **A business email on your own domain**, if the form requires it.
4. **Your real numbers.** Replace every `[FILL]` below. Leave traction blank rather than invent it.

## One-line description

Eligibly shows people outside the US and EU only the remote jobs that are actually open to their country, proves it with a quote from the posting, and prepares the application. It stops at Apply.

## Problem

"Remote" does not mean "remote from anywhere". Hiring rules hide in location fields, titles and fine print: "Remote - US", "EMEA", "must be authorized to work in Canada". A candidate in Kazakhstan, Nigeria or India reads dozens of postings to find the few they can actually take, then retypes the same details into each company's form.

We measured it on a snapshot of public postings (2026-10-08): **1,575 jobs labelled remote at 25 well-known tech companies. 952 are open to a US-based candidate. 53 to Germany. 32 to India. 2 to Nigeria. 0 are verifiably open to Kazakhstan or Uzbekistan** (another 109 are unclear). Reproduce with `npm run refresh` and the demo site.

## Solution

1. Read each public posting once and turn its hiring rules into structured constraints (worldwide, limited to countries or regions, unclear), plus a verbatim quote that states the rule.
2. For each candidate, compute YES / UNCLEAR / NO from their country. No quote, no YES.
3. Prepare the application: a tailored CV and an answer pack from the candidate's own facts, which the candidate approves.
4. Stop. The platform never emails employers, answers recruiters or tracks replies.

## Why Claude, specifically

- **Reading messy legal-ish text:** Claude turns free-form postings into a strict JSON schema (scope, countries, regions, conflict, sponsorship, quote).
- **Safety by construction:** postings are untrusted input. The model's answer is only accepted if its quote appears verbatim in the posting, so a prompt-injected "open to everyone" cannot produce a YES (covered by a test).
- **Tailoring without invention:** the CV is generated only from the candidate's verified profile, and every employer, title and date in the output is checked against it.
- **Cost shape:** classify each posting once (not once per user), cheap model first, escalate only unclear cases. Weekly re-evaluation on a hand-labelled gold set guards against drift.

## Stage and traction (be exact)

- Stage: pre-revenue prototype. Started 8 October 2026.
- Built: ingestion from public Greenhouse boards (30 companies), rule-based classifier with 16 passing tests, live demo, application-pack builder. LLM classifier path written and tested against a mocked API; not yet run on the live API.
- Users: 0. Customer interviews: 0. Paying customers: 0. The first 10 interviews and the concierge test are planned in `docs/VALIDATION.md`.
- Not yet measured: classifier precision on a hand-labelled set (target: 90% on YES over 200 postings), willingness to pay.

## What we will do with the credits

1. Run the Claude classifier over every posting we ingest (about 1,600 remote postings per full refresh of the current 30-company snapshot) and measure precision and recall against a hand-labelled set of 200.
2. Build the tailoring step (profile to CV and answer pack) with an automated check that no experience is invented.
3. Concierge test with 10 job seekers from Kazakhstan, timing each application step, then publish the results.

## Business model (hypothesis, untested)

Subscription for job seekers, price not set yet; it will be set from the concierge test, validated first by whether 3 of 10 concierge users agree to a concrete price and enter payment details.

## Team

[FILL: your name, background, why you are the person for this problem. Mention your own experience applying for jobs abroad if true.]

## Links

- Demo: https://eligibly.xyz
- Code: [FILL: repository URL]
- Design doc and engineering review: `docs/DESIGN.md`
