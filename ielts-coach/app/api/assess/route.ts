import { AssessmentSchema, SYSTEM_PROMPT, demoAssessment, userMessage } from "@/lib/assess";
import { completeJson, hasKey } from "@/lib/ai";
import { adminClient, serverClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { applyAssessment } from "@/lib/learning";
import { ALL_QUESTIONS } from "@/lib/topics";

const MIN_WORDS = 50;
const MAX_WORDS = 500;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 1000) : "";
  const essay = typeof body?.essay === "string" ? body.essay : "";
  if (!ALL_QUESTIONS.has(prompt)) return Response.json({ error: "Please choose a question from the topic list." }, { status: 400 });
  const words = essay.trim().split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) return Response.json({ error: `Please write at least ${MIN_WORDS} words.` }, { status: 400 });
  if (words > MAX_WORDS) return Response.json({ error: `Please keep it under ${MAX_WORDS} words.` }, { status: 400 });

  // Without Supabase or an AI key: demo only, nothing saved, no spend.
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY || !hasKey()) {
    return Response.json({ demo: true, assessment: demoAssessment() });
  }

  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Please sign in." }, { status: 401 });
  const userId = auth.user.id;
  const db = adminClient();

  const limit = Number(process.env.IELTS_DAILY_ASSESS_LIMIT ?? 5);
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from("ai_usage_logs").select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("operation_type", "assess_essay").gte("created_at", dayStart.toISOString());
  if ((count ?? 0) >= limit) return Response.json({ error: `Daily limit of ${limit} checks reached. Please come back tomorrow.` }, { status: 429 });

  // Save the essay first: an AI failure must never lose it.
  const { data: sub, error: subErr } = await db.from("submissions")
    .insert({ student_id: userId, task_prompt: prompt, essay_text: essay, word_count: words }).select("id").single();
  if (subErr || !sub) return Response.json({ error: "Could not save the essay." }, { status: 500 });

  let r;
  try {
    r = await completeJson(SYSTEM_PROMPT, userMessage(prompt, essay));
  } catch {
    await db.from("ai_usage_logs").insert({ user_id: userId, operation_type: "assess_essay", status: "error" });
    await db.from("submissions").update({ status: "failed" }).eq("id", sub.id);
    return Response.json({ error: "The AI service had a problem. Your essay is saved; please try again later.", id: sub.id }, { status: 502 });
  }
  await db.from("ai_usage_logs").insert({ user_id: userId, operation_type: "assess_essay", model_identifier: r.model, input_tokens: r.inputTokens, output_tokens: r.outputTokens, status: "ok" });

  let assessment;
  try {
    assessment = AssessmentSchema.parse(JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1)));
  } catch {
    await db.from("submissions").update({ status: "failed" }).eq("id", sub.id);
    return Response.json({ error: "The AI reply could not be validated. Your essay is saved.", id: sub.id }, { status: 502 });
  }

  await db.from("assessments").insert({ submission_id: sub.id, model_identifier: r.model, rubric_version: "v1", scores_json: assessment });
  await db.from("submissions").update({ status: "assessed" }).eq("id", sub.id);
  try { await applyAssessment(db, userId, sub.id, assessment); } catch (e) { console.error("applyAssessment", e); }
  return Response.json({ demo: false, id: sub.id });
}
