# IELTS Writing Coach (MVP)

Next.js 16 + Supabase (Auth + Postgres) + DeepSeek (or Claude). Separate from the Eligibly prototype in the repo root.

## Works
English student UI. 52 topics x 5 questions (content/topics.md -> `node scripts/build-topics.mjs` -> lib/topics.json), question picker, dashboard with strengths / growth / next focus, My Writing Skills (4 criteria + 8 skills with levels), Progress chart, Vocabulary Bank, target band.
Skill levels come from graded per-skill evidence (score 0-1 + confidence per essay), a weighted history of the last 5 essays and the criterion band as a prior - not from fixed percentages.

Registration (email confirmation), login/logout, protected cabinet, essay editor (draft autosave), AI check by 4 IELTS criteria (schema-validated), saved results and history, skill map with mastery, mistake journal, learning plan (next step = weakest skill), per-user daily limit, usage log.
Essays are saved before the AI call, so an AI failure never loses them. Without Supabase/AI keys the site runs in demo mode: nothing saved, no spend.

## Attach files (new essay)
Up to 12 files (40 MB total) per batch: photos, PDF, .md or .txt. Files go into a list (thumbnails, reorder, remove); "+ Add more files" and "Take photo" (opens the phone camera) add to it; "Proceed" reads everything in the order shown and puts the joined text in the editor (replace or append). A page that stops mid-sentence continues the same paragraph. One bad file does not stop the others.
Single files: Markdown/text and PDFs with a text layer are read in the browser. Photos and scanned PDFs use OCR:
- Default: on-device tesseract.js (self-hosted in /public/tesseract, nothing uploaded). It reads typed/printed text only. If confidence is under 60% (typical for handwriting) the text is NOT put into the editor automatically; the student can choose "Insert anyway".
- Handwriting: set ONE of `GEMINI_API_KEY` (Google AI Studio, free tier), `OPENAI_API_KEY` or `OCR_ANTHROPIC_API_KEY`. The image is then read by that vision model via `/api/ocr` (sign-in required, per-user daily limit `IELTS_DAILY_OCR_LIMIT`, default 30; only successful reads count) and the UI tells the student the image is sent to a service. Force a provider with `OCR_PROVIDER`, change model with `OCR_MODEL`.
The recognised text always lands in the editor for the student to correct before checking. OCR assets are copied to `public/` on `npm install` (postinstall) and are git-ignored.

## Not built yet
Teacher cabinet and score correction, RAG over the 50 Markdown books, exercises with re-grading, password reset UI, account deletion, admin pages.

## Setup
1. Create a Supabase project. In SQL editor run `supabase/migrations/0001_init.sql`, `0002_app.sql`, then `0003_cabinet.sql`.
2. Auth > URL Configuration: set Site URL to your Vercel URL and add `<url>/auth/callback` to Redirect URLs.
3. Vercel: Root Directory `ielts-coach`; env vars from `.env.example`.
4. `npm install && npm run dev` locally.
