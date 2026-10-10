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

const DEFAULT_MODEL: Record<OcrProvider, string> = { gemini: "gemini-2.5-flash", openai: "gpt-4o-mini", anthropic: "claude-haiku-5-5" };

export async function transcribe(mime: string, base64: string): Promise<{ text: string; model: string; provider: OcrProvider }> {
  const provider = ocrProvider();
  if (!provider) throw new Error("no OCR provider configured");
  const model = process.env.OCR_MODEL ?? DEFAULT_MODEL[provider];
  const signal = AbortSignal.timeout(55_000);
  let text = "";

  if (provider === "gemini") {
    const base = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com";
    const res = await fetch(`${base}/v1beta/models/${model}:generateContent`, {
      method: "POST", signal,
      headers: { "x-goog-api-key": keys().gemini!, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: PROMPT }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 2500 },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    text = (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  } else if (provider === "openai") {
    const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST", signal,
      headers: { authorization: `Bearer ${keys().openai}`, "content-type": "application/json" },
      body: JSON.stringify({
        model, max_tokens: 2500, temperature: 0,
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: `data:${mime};base64,${base64}`, detail: "high" } }] }],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    text = d?.choices?.[0]?.message?.content ?? "";
  } else {
    const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST", signal,
      headers: { "x-api-key": keys().anthropic!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 2500, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mime, data: base64 } }, { type: "text", text: PROMPT }] }] }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    text = d?.content?.[0]?.text ?? "";
  }
  return { text: String(text).trim(), model, provider };
}
