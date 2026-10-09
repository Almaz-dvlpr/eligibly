import { AssessmentSchema, SYSTEM_PROMPT, demoAssessment, userMessage } from "@/lib/assess";
import { completeJson, hasKey } from "@/lib/ai";

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

  // In production real AI spend requires the access gate to be on.
  const gated = !!process.env.ACCESS_CODE || process.env.NODE_ENV !== "production";
  if (!hasKey() || !gated) return Response.json({ demo: true, assessment: demoAssessment() });

  const today = new Date().toISOString().slice(0, 10);
  if (day !== today) { day = today; used = 0; }
  if (used >= Number(process.env.IELTS_DAILY_ASSESS_LIMIT ?? 50)) {
    return Response.json({ error: "Дневной лимит проверок исчерпан." }, { status: 429 });
  }
  used++;

  let r;
  try {
    r = await completeJson(SYSTEM_PROMPT, userMessage(prompt, essay));
  } catch {
    return Response.json({ error: "Ошибка ИИ-сервиса, эссе не потеряно — попробуйте ещё раз." }, { status: 502 });
  }
  console.log(JSON.stringify({ op: "assess_essay", model: r.model, in: r.inputTokens, out: r.outputTokens }));
  try {
    const json = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1));
    return Response.json({ demo: false, assessment: AssessmentSchema.parse(json) });
  } catch {
    return Response.json({ error: "Ответ модели не прошёл проверку схемы." }, { status: 502 });
  }
}
