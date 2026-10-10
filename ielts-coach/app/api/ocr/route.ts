import { serverClient, adminClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const maxDuration = 60;

// Optional server-side OCR with a vision model: much better on handwriting than the in-browser engine.
// Enabled only when a key and a database are configured, so usage can be tied to a signed-in user and limited.
const enabled = () => !!process.env.OCR_ANTHROPIC_API_KEY && supabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return Response.json({ error: "Server OCR is not enabled." }, { status: 503 });
  const { data: auth } = await (await serverClient()).auth.getUser();
  if (!auth.user) return Response.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const m = typeof body?.image === "string" ? body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!m) return Response.json({ error: "Send a JPG, PNG or WebP image." }, { status: 400 });
  if (m[2].length > 5_000_000) return Response.json({ error: "Image is too large." }, { status: 413 });

  const db = adminClient();
  const limit = Number(process.env.IELTS_DAILY_OCR_LIMIT ?? 10);
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from("ai_usage_logs").select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id).eq("operation_type", "ocr").gte("created_at", dayStart.toISOString());
  if ((count ?? 0) >= limit) return Response.json({ error: `Daily limit of ${limit} image reads reached.` }, { status: 429 });

  const model = process.env.OCR_MODEL ?? "claude-haiku-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(55_000),
    headers: { "x-api-key": process.env.OCR_ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model, max_tokens: 2000,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
        { type: "text", text: "Transcribe the English text in this image exactly as written, including spelling and grammar mistakes. Do not correct, translate, summarise or comment. Keep paragraph breaks as blank lines. Output only the transcription. If there is no readable text, output nothing." },
      ] }],
    }),
  });
  await db.from("ai_usage_logs").insert({ user_id: auth.user.id, operation_type: "ocr", model_identifier: model, status: res.ok ? "ok" : "error" });
  if (!res.ok) { console.error("ocr failed", res.status, (await res.text()).slice(0, 200)); return Response.json({ error: "Could not read the image. Please try again." }, { status: 502 }); }
  const d = await res.json();
  return Response.json({ text: String(d?.content?.[0]?.text ?? "").trim() });
}
