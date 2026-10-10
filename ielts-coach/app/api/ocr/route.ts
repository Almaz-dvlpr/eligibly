import { serverClient, adminClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { OcrError, ocrProvider, transcribe } from "@/lib/ocr";

export const maxDuration = 60;

// AI image reading (much better on handwriting than the in-browser engine). Enabled only with a provider key
// AND a database, so every call is tied to a signed-in user and limited per day.
const enabled = () => !!ocrProvider() && supabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  return Response.json({ enabled: enabled(), provider: ocrProvider(), limit: Number(process.env.IELTS_DAILY_OCR_LIMIT ?? 10) });
}

export async function POST(req: Request) {
  if (!enabled()) return Response.json({ error: "AI image reading is not enabled." }, { status: 503 });
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

  try {
    const r = await transcribe(m[1], m[2]);
    await db.from("ai_usage_logs").insert({ user_id: auth.user.id, operation_type: "ocr", model_identifier: `${r.provider}:${r.model}`, status: "ok" });
    return Response.json({ text: r.text });
  } catch (e) {
    console.error("ocr failed:", e);
    await db.from("ai_usage_logs").insert({ user_id: auth.user.id, operation_type: "ocr", status: "error" });
    const hint = e instanceof OcrError
      ? e.status === 401 || e.status === 403 ? " The AI key was rejected: check the key in the site settings."
        : e.status === 429 ? " The AI service is out of quota or rate-limited."
        : e.status === 404 || e.status === 400 ? " The AI model name or the request was rejected."
        : ""
      : "";
    const code = e instanceof OcrError ? ` (${e.provider} ${e.status})` : "";
    return Response.json({ error: `Could not read the image${code}.${hint} Please try again.` }, { status: 502 });
  }
}
