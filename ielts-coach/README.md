# IELTS Writing Coach (MVP)

Next.js 16 + Supabase (Auth + Postgres) + DeepSeek (or Claude). Separate from the Eligibly prototype in the repo root.

## Works
Registration (email confirmation), login/logout, protected cabinet, essay editor (draft autosave), AI check by 4 IELTS criteria (schema-validated), saved results and history, skill map with mastery, mistake journal, learning plan (next step = weakest skill), per-user daily limit, usage log.
Essays are saved before the AI call, so an AI failure never loses them. Without Supabase/AI keys the site runs in demo mode: nothing saved, no spend.

## Not built yet
Teacher cabinet and score correction, RAG over the 50 Markdown books, exercises with re-grading, password reset UI, account deletion, admin pages.

## Setup
1. Create a Supabase project. In SQL editor run `supabase/migrations/0001_init.sql`, then `0002_app.sql`.
2. Auth > URL Configuration: set Site URL to your Vercel URL and add `<url>/auth/callback` to Redirect URLs.
3. Vercel: Root Directory `ielts-coach`; env vars from `.env.example`.
4. `npm install && npm run dev` locally.
