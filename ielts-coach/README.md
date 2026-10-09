# IELTS Writing Coach (MVP, step 1)

Next.js app, deployable to Vercel. Separate from the Eligibly prototype in the repo root.

Done: landing, essay editor with local draft, `/api/assess` (schema-validated, word limits, daily cap, demo mode without a key), skill map, Supabase schema draft with RLS.
Access: set `ACCESS_CODE` in Vercel; without it production runs in demo mode (no AI spend).
Not done yet: auth, saving to DB, RAG over the 50 Markdown books, learning plan, teacher cabinet.

```bash
npm install && npm run dev
```

## Deploy to Vercel
Import the repo, set **Root Directory = `ielts-coach`**, framework Next.js. Set `DEEPSEEK_API_KEY` (see `.env.example`); without a key the app runs in demo mode. `AI_PROVIDER=anthropic` switches provider.
