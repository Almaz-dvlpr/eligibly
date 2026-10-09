# Claude for Startups: application draft (Eligibly)

> **Official program page (read 2026-10-09, claude.com/programs/startups).** No VC funding required: bootstrapped, pre-seed and venture-backed startups can apply. Apply by signing in to the Claude Console and filling out the application. Review aims for one week, decision by email. The page says the Claude Team and $1,000 API credit offers are currently over capacity and all applications are being re-reviewed, so those credits are not guaranteed. Members get the Claude Startup Stack (third-party discounts and credits, "worth up to $45,000"), Applied AI office hours (45 minutes, every other week), events, and higher API rate limits if they receive credits. Credits work only on the first-party Claude API in Console, not Bedrock or Vertex. VC-partner referral can add up to $100K. The page does not list incorporation or company-age requirements: read the form itself before you assume any.

## Before you apply: blockers to clear (in order)

1. **A legal entity or whatever the form accepts.** The program page does not state an incorporation requirement. If the Console form asks for a registered company, say honestly what you have.
2. **A public URL.** Deploy `site/` (static; works on Vercel, Netlify, Cloudflare Pages or GitHub Pages). Put the URL in the form.
3. **A business email on your own domain**, if the form requires it.
4. **Your real numbers.** Replace every `[FILL]` below. Leave traction blank rather than invent it.

## One-line description

Eligibly helps teachers who want to work abroad find the international schools that will actually consider a candidate from their country, shows the evidence, and prepares the applications. It stops at Apply. Today the prototype proves the method on public remote postings; collecting school vacancy data is the next step.

## Problem

The founder is an English teacher at a private school. When looking for teaching jobs abroad, he asked Claude to send his CV to every private international school in one city and found how much manual checking sits behind that request: which schools hire candidates from his country, who sponsors visas, what each one requires, and the same details retyped into each application. This is one firsthand account, not yet validated by interviews (see Stage and traction).

The same pattern is measurable in remote work, where public data exists. "Remote" does not mean "remote from anywhere". Hiring rules hide in location fields, titles and fine print: "Remote - US", "EMEA", "must be authorized to work in Canada". A candidate in Kazakhstan, Nigeria or India reads dozens of postings to find the few they can actually take, then retypes the same details into each company's form.

We measured it on a snapshot of public postings (2026-10-08): **1,575 jobs labelled remote at 25 well-known tech companies. 952 are open to a US-based candidate. 53 to Germany. 32 to India. 2 to Nigeria. 0 are verifiably open to Kazakhstan or Uzbekistan** (another 109 are unclear). Reproduce with `npm run refresh` and the demo site.

## Solution

Starting market (hypothesis, to validate): teachers and other school staff in Kazakhstan who want to work at international schools abroad. The method below is built and tested on public remote job postings; applying it to school vacancies requires a data source we have not built yet.

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
- Built (on public remote tech postings, not school data): ingestion from public Greenhouse boards (30 companies), rule-based classifier with 16 passing tests, live demo, application-pack builder. LLM classifier path written and tested against a mocked API; not yet run on the live API.
- Users: 0. Customer interviews: 0. Paying customers: 0. The first 10 interviews and the concierge test are planned in `docs/VALIDATION.md`.
- Not yet measured: classifier precision on a hand-labelled set (target: 90% on YES over 200 postings), willingness to pay.

## What we will do with the credits

1. Run the Claude classifier over every posting we ingest (about 1,600 remote postings per full refresh of the current 30-company snapshot) and measure precision and recall against a hand-labelled set of 200.
2. Build the tailoring step (profile to CV and answer pack) with an automated check that no experience is invented.
3. Research how international schools publish vacancies and which signals decide whether they consider a candidate from a given country, then extend the classifier to them.
4. Concierge test with 10 English teachers from Kazakhstan, timing each application step, then publish the results.

## Business model (hypothesis, untested)

Subscription for job seekers, price not set yet; it will be set from the concierge test, validated first by whether 3 of 10 concierge users agree to a concrete price and enter payment details.

## Team

**Almaz Amirzhan, founder.** I work as an English teacher at a private school. While looking for teaching jobs abroad, I asked Claude to help me send my CV to every private international school in one city abroad. That attempt is where this company comes from: I lived the problem as the user, including the repetitive applications and the uncertainty about which schools would actually consider a candidate from my country. I build the product from that user's point of view and use Claude as my engineering partner for the prototype.

## Links

- Demo: https://eligibly.xyz
- Code: https://github.com/Almaz-dvlpr/eligibly
- Founder: https://www.linkedin.com/in/almaz-amirzhan-b6600b5b
- Contact: almazamirhzan@eligibly.xyz
- Design doc and engineering review: `docs/DESIGN.md`
