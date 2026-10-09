// AI Gateway: single place that talks to an LLM. Provider chosen by AI_PROVIDER.
export type AiResult = { text: string; inputTokens?: number; outputTokens?: number; model: string };
export type Provider = "deepseek" | "anthropic";

export function provider(): Provider {
  return process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "deepseek";
}

export function hasKey(): boolean {
  return provider() === "deepseek" ? !!process.env.DEEPSEEK_API_KEY : !!process.env.ANTHROPIC_API_KEY;
}

export async function completeJson(system: string, user: string, maxTokens = 2000): Promise<AiResult> {
  if (provider() === "deepseek") {
    // DeepSeek is OpenAI-compatible. JSON mode requires the word "json" in the prompt.
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
    const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`deepseek ${res.status}`);
    const d = await res.json();
    return { text: d?.choices?.[0]?.message?.content ?? "", inputTokens: d?.usage?.prompt_tokens, outputTokens: d?.usage?.completion_tokens, model };
  }
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const d = await res.json();
  return { text: d?.content?.[0]?.text ?? "", inputTokens: d?.usage?.input_tokens, outputTokens: d?.usage?.output_tokens, model };
}
