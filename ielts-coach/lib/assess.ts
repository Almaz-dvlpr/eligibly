import { z } from "zod";

// Lenient on purpose: models drift on counts, casing and number formats. We normalise instead of rejecting a whole essay.
const num = (min: number, max: number) => z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().transform((n) => Math.min(max, Math.max(min, n))));
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).default([]).transform((a) => a.slice(0, max));

const Criterion = z.object({
  estimated_band: num(0, 9),
  evidence: list(z.object({
    excerpt: z.string().default(""), issue: z.string().default(""), explanation: z.string().default(""),
    suggested_correction: z.string().optional(),
  }), 6),
  strengths: list(z.string(), 4),
  next_steps: list(z.string(), 4),
});

export const AssessmentSchema = z.object({
  task_type: z.any().transform(() => "task2" as const),
  criteria: z.object({
    task_response: Criterion,
    coherence_cohesion: Criterion,
    lexical_resource: Criterion,
    grammatical_range_accuracy: Criterion,
  }),
  skill_evidence: list(z.object({
    skill_code: z.string().transform((c) => c.trim().toUpperCase()),
    evidence_status: z.string().transform((v) => (v === "ok" || v === "insufficient_data" ? v : "needs_practice") as "needs_practice" | "ok" | "insufficient_data"),
    confidence: num(0, 1).default(0.5),
    score: num(0, 1).optional(),
  }), 16),
  vocabulary_suggestions: list(z.object({ term: z.string(), meaning: z.string().default(""), example: z.string().default("") }), 5).optional(),
  needs_teacher_review: z.boolean().default(false),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export const SYSTEM_PROMPT = `You are a supportive, precise IELTS Writing Task 2 examiner-coach. Assess the essay against the four public band descriptors.
Return ONLY a json object matching the requested keys. Be concise: at most 2 evidence items and 2 strengths per criterion, one short sentence each. Write all feedback in clear English, in an encouraging tone: lead with what works, then give concrete improvements. Never use words like "bad" or "weak".
Rules:
- Every issue must quote an exact excerpt from the essay. For language issues add suggested_correction with a better version of that sentence.
- Bands are estimates in 0.5 steps, not official scores. If the essay is too short or off-topic, lower Task Response and set needs_teacher_review true.
- Assess ALL eight skills in skill_evidence, one entry each: TR-01 reading the question, TR-02 clear position, TR-03 developing arguments, CC-01 paragraph structure, CC-02 linking ideas, LR-01 precise vocabulary, GRA-01 complex sentences, GRA-02 grammatical accuracy.
- For each skill give score between 0 and 1 using this anchor: 0.2 = the skill often breaks down; 0.4 = present but frequently inaccurate or missing; 0.6 = generally works with noticeable lapses; 0.8 = controlled with rare lapses; 0.95 = fully controlled. Use the full range and be specific: count the opportunities and the lapses you actually saw (for example 2 lapses in 9 sentences is about 0.75). Do NOT default to round numbers and keep each score consistent with its criterion band (band 5 is about 0.3, 6 about 0.55, 7 about 0.75, 8 about 0.9).
- confidence is how much evidence the essay gives for that skill (0-1). Use evidence_status "insufficient_data" only when the essay gives no evidence.
- vocabulary_suggestions: up to 5 useful, more precise words or collocations the student could use on this topic, each with a short meaning and an example sentence.`;

export function userMessage(prompt: string, essay: string): string {
  return `Task prompt:\n${prompt}\n\nEssay:\n${essay}\n\nRespond with a json object with keys: task_type ("task2"), criteria {task_response, coherence_cohesion, lexical_resource, grammatical_range_accuracy: {estimated_band, evidence[{excerpt, issue, explanation, suggested_correction}], strengths[], next_steps[]}}, skill_evidence[{skill_code, evidence_status (needs_practice|ok|insufficient_data), confidence, score}], vocabulary_suggestions[{term, meaning, example}], needs_teacher_review (boolean).`;
}

export function demoAssessment(): Assessment {
  const c = (band: number) => ({ estimated_band: band, evidence: [], strengths: [], next_steps: ["Demo mode: the AI key or database is not configured, so these numbers are placeholders."] });
  return {
    task_type: "task2",
    criteria: { task_response: c(6), coherence_cohesion: c(6), lexical_resource: c(6), grammatical_range_accuracy: c(6) },
    skill_evidence: [],
    needs_teacher_review: true,
  };
}
