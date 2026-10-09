# Validation plan: 14 days to real evidence

Goal: replace "my own pain" with named people, timings and a price signal before you spend on growth. This is also what makes the Claude for Startups application credible.

## Day 1-2: find 10 people

Write down 10 real people outside the US/EU who are looking for a remote job now. Sources: your own contacts, local developer and professional chats, universities, alumni groups. Name, country, role, one line on where they search today.

## Day 3-7: watch, do not demo

For 5 of them, screen-share while they apply to ONE job, without helping. Time each step:

| Step | Minutes |
|---|---|
| Finding a job | |
| Checking if they are eligible | |
| Adapting the CV | |
| Filling the form | |

Write down every surprise. Then show them `site/index.html` for their country and watch what they click first. Do not explain.

## Day 8-12: the concierge round

For each person, run `npm run refresh`, take their YES and UNCLEAR jobs by hand, and send them 5 with the quoted rule. Ask after 3 days: how many did you apply to? How many were wrong about eligibility?

## Day 13-14: the price question

Ask each: "If this saved you X hours a week, would you pay $[FILL] per month? Can you pay now?" Count who enters payment details, not who says yes.

## Decision rules

- 7 of 10 still using it after a week and fewer than 1 in 10 "eligible" jobs wrong: build the web platform.
- Many wrong verdicts: fix the classifier before anything else (build the 200-posting gold set first).
- Most people say the pain is finding jobs, not applying: drop the application pack, keep the eligibility feed.
- 3 of 10 ask for one-click submit: only then design auto-submit (it is deferred on purpose).

## Interview questions (ask in this order)

1. Tell me about the last job you applied to abroad. What happened, step by step?
2. How many postings did you read before you found one you could actually take?
3. What did you do when a posting did not say whether your country was allowed?
4. What do you use today, and what does it cost you in time or money?
5. Have you ever paid anyone (agency, freelancer, tool) to help? How much?
