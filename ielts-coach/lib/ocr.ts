// Server-side image transcription with a vision model. Provider is chosen by env; all share one prompt.
export type OcrProvider = "gemini" | "openai" | "anthropic";

const PROMPT = "Transcribe the English handwriting or text in this image exactly as written, including spelling and grammar mistakes. Do not correct, translate, summarise or comment. Ignore underlines, highlighter marks and circles. Keep paragraph breaks as blank lines (a new paragraph usually starts with an indented line). Output only the transcription. If there is no readable text, output nothing.";

const keys = () => ({
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.OCR_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
});

export function ocrProvider(): OcrProvider | null {
  const k = keys();
  const want = process.env.OCR_PROVIDER as OcrProvider | undefined;
  if (want && k[want]) return want;
  return k.gemini ? "gemini" : k.openai ? "openai" : k.anthropic ? "anthropic" : null;
}

const DEFAULT_MODEL: Record<OcrProvider, string> = { gemini: "gemini-flash-latest", openai: "gpt-4o-mini", anthropic: "claude-haiku-5-5" };
// Tried in order when the first Gemini model name is rejected (names get retired over time).
const GEMINI_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash"];

export class OcrError extends Error {
  // status 0 means the request never got an HTTP answer: see `reason`.
  constructor(public provider: OcrProvider, public status: number, public reason?: "timed out" | "network error") { super(`${provider} ${reason ?? status}`); }
}

// Kept under the 60 s function limit so we can answer with a clear message instead of being killed.
const TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS ?? 50_000);

async function call(provider: OcrProvider, url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    console.error(`${provider} request failed:`, e);
    throw new OcrError(provider, 0, e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "timed out" : "network error");
  }
}

export async function transcribe(mime: string, base64: string): Promise<{ text: string; model: string; provider: OcrProvider }> {
  const provider = ocrProvider();
  if (!provider) throw new Error("no OCR provider configured");
  const model = process.env.OCR_MODEL ?? DEFAULT_MODEL[provider];
  let text = "";

  if (provider === "gemini") {
    const base = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com";
    const candidates = process.env.OCR_MODEL ? [model] : [model, ...GEMINI_FALLBACKS];
    let lastStatus = 0;
    for (const m of candidates) {
      // Thinking is switched off: for plain transcription it only adds delay (and can eat the output budget).
      let res = await call(provider, `${base}/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": keys().gemini!, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: PROMPT }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 4000, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (res.status === 400) { // some models reject the thinking setting: retry the same model without it
        console.error(`gemini ${m} with thinkingBudget -> 400: ${(await res.text()).slice(0, 200)}`);
        res = await call(provider, `${base}/v1beta/models/${m}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": keys().gemini!, "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: PROMPT }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 4000 },
          }),
        });
      }
      if (res.ok) {
        const d = await res.json();
        text = (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
        return { text: String(text).trim(), model: m, provider };
      }
      lastStatus = res.status;
      console.error(`gemini ${m} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
      if (res.status !== 404 && res.status !== 400) break; // key/quota problems will not be fixed by another model
    }
    throw new OcrError(provider, lastStatus);
  } else if (provider === "openai") {
    const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
    const res = await call(provider, `${base}/v1/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${keys().openai}`, "content-type": "application/json" },
      body: JSON.stringify({
        model, max_tokens: 4000, temperature: 0,
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "high" } }] }],
      }),
    });
    if (!res.ok) { console.error("openai", res.status, (await res.text()).slice(0, 300)); throw new OcrError("openai", res.status); }
    const d = await res.json();
    text = d?.choices?.[0]?.message?.content ?? "";
  } else {
    const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
    const res = await call(provider, `${base}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": keys().anthropic!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mime, data: base64 } }, { type: "text", text: PROMPT }] }] }),
    });
    if (!res.ok) { console.error("anthropic", res.status, (await res.text()).slice(0, 300)); throw new OcrError("anthropic", res.status); }
    const d = await res.json();
    text = d?.content?.[0]?.text ?? "";
  }
  return { text: String(text).trim(), model, provider };
}
