import { AssessmentSchema, SYSTEM_PROMPT, demoAssessment } from "@/lib/assess";

const MAX_WORDS = 450;
let day = "";
let used = 0;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 1000) : "";
  const essay = typeof body?.essay === "string" ? body.essay : "";
  const words = essay.trim().split(/\s+/).filter(Boolean).length;
  if (words < 50) return Response.json({ error: "Минимум 50 слов." }, { status: 400 });
  if (words > MAX_WORDS) return Response.json({ error: `Максимум ${MAX_WORDS} слов.` }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ demo: true, assessment: demoAssessment() });

  const today = new Date().toISOString().slice(0, 10);
  if (day !== today) { day = today; used = 0; }
  if (used >= Number(process.env.IELTS_DAILY_ASSESS_LIMIT ?? 50)) {
    return Response.json({ error: "Дневной лимит проверок исчерпан." }, { status: 429 });
  }
  used++;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ELIGIBLY_IELTS_MODEL ?? "claude-haiku-5-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Task prompt:\n${prompt}\n\nEssay:\n${essay}\n\nJSON schema keys: task_type("task2"), criteria{task_response,coherence_cohesion,lexical_resource,grammatical_range_accuracy: {estimated_band,evidence[{excerpt,issue,explanation}],strengths[],next_steps[]}}, skill_evidence[{skill_code,evidence_status(needs_practice|ok|insufficient_data),confidence}], needs_teacher_review(boolean).` }],
    }),
  });
  if (!res.ok) return Response.json({ error: "Ошибка ИИ-сервиса, эссе не потеряно — попробуйте ещё раз." }, { status: 502 });
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  try {
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return Response.json({ demo: false, assessment: AssessmentSchema.parse(json) });
  } catch {
    return Response.json({ error: "Ответ модели не прошёл проверку схемы." }, { status: 502 });
  }
}
