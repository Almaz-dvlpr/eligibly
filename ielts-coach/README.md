# IELTS Writing Coach (MVP, step 1)

Next.js app, deployable to Vercel. Separate from the Eligibly prototype in the repo root.

Done: landing, essay editor with local draft, `/api/assess` (schema-validated, word limits, daily cap, demo mode without a key), skill map, Supabase schema draft with RLS.
Not done yet: auth, saving to DB, RAG over the 50 Markdown books, learning plan, teacher cabinet.

```bash
npm install && npm run dev
```

## Deploy to Vercel
Import the repo, set **Root Directory = `ielts-coach`**, framework Next.js. Env vars: see `.env.example` (`ANTHROPIC_API_KEY` is optional; without it the app runs in demo mode).
