import { z } from "zod";
import { textMetrics, type Metrics } from "./metrics";

// Lenient on purpose: models drift on counts, casing and number formats. We normalise instead of rejecting a whole essay.
const num = (min: number, max: number) => z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number().transform((n) => Math.min(max, Math.max(min, n))));
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).default([]).transform((a) => a.slice(0, max));

const Criterion = z.object({
  rationale: z.string().optional(),
  estimated_band: num(0, 9),
  evidence: list(z.object({
    excerpt: z.string().default(""), issue: z.string().default(""), explanation: z.string().default(""),
    suggested_correction: z.string().optional(),
  }), 6),
  strengths: list(z.string(), 4),
  next_steps: list(z.string(), 4),
});

export const AssessmentSchema = z.object({
  task_type: z.any().optional().transform(() => "task2" as const),
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
  calibration_notes: z.array(z.string()).optional(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export const SYSTEM_PROMPT = `You are a strict, fair IELTS Writing Task 2 examiner who also coaches. Assess the essay against the four public band descriptors, then explain it kindly.
Return ONLY a json object. Write all feedback in clear English, encouraging in tone: lead with what works, then give concrete improvements. Never use words like "bad" or "weak". Be concise: at most 2 evidence items and 2 strengths per criterion, one short sentence each.

CALIBRATION - real examiners are conservative. Typical learner essays land between 5.0 and 6.5. Do not give 7 or above unless EVERY part of the band 7 descriptor is clearly met. When unsure between two bands, choose the lower one.
For each criterion first write "rationale": 2-3 sentences that name the descriptor features you saw or did not see, using the measurements provided. Only then set estimated_band (0.5 steps).
- Task Response: band 7 needs a clear position AND ideas that are fully extended with specific supporting detail. Generic ideas ("X helps students get knowledge") or examples that only restate the idea cap this at 6.0 or lower. Band 6: all parts addressed but ideas are underdeveloped. Band 5: only partly addressed or mostly general statements. Fewer than 250 words lowers the band.
- Coherence & Cohesion: band 7 needs a clear progression with logical paragraphing and flexible use of cohesive devices. Mechanical or repeated linkers (On the one hand / However / Also / Therefore) limit this to 6.5 or lower.
- Lexical Resource: judge the range and precision of vocabulary, collocation and word-formation errors against the public band descriptors. Repeating the key words of the topic is natural and must not lower the band by itself.
- Grammatical Range & Accuracy: band 7 needs a variety of complex structures, frequent error-free sentences and good control. If most sentences are simple or compound with the same patterns and complex structures are rare, this is 5.5-6.0 even when errors are rare. (The complex-sentence share in the measurements is only a rough regex count, so judge by reading the text.)
Overall coherence of an essay can be higher than its grammar or ideas; criteria must be allowed to differ by 1 band or more.

Rules:
- Every issue must quote an exact excerpt from the essay. For language issues add suggested_correction.
- If the essay is too short or off-topic, lower Task Response and set needs_teacher_review true.
- Assess ALL eight skills in skill_evidence, one entry each: TR-01 reading the question, TR-02 clear position, TR-03 developing arguments, CC-01 paragraph structure, CC-02 linking ideas, LR-01 precise vocabulary, GRA-01 complex sentences, GRA-02 grammatical accuracy.
- For each skill give score between 0 and 1: 0.2 = often breaks down; 0.4 = present but frequently inaccurate or missing; 0.6 = generally works with noticeable lapses; 0.8 = controlled with rare lapses; 0.95 = fully controlled. Count the opportunities and lapses you actually saw. Keep each score consistent with its criterion band (band 5 is about 0.3, 6 about 0.55, 7 about 0.75, 8 about 0.9). Do NOT default to round numbers.
- confidence is how much evidence the essay gives for that skill (0-1). Use evidence_status "insufficient_data" only when the essay gives no evidence.
- vocabulary_suggestions: up to 5 useful, more precise words or collocations for this topic, each with a short meaning and an example sentence.`;

export function userMessage(prompt: string, essay: string, m: Metrics = textMetrics(essay)): string {
  const facts = `Measurements (computed by software, treat as facts): ${m.words} words, ${m.sentences} sentences, ${m.paragraphs} paragraphs, average ${m.avgSentenceWords} words per sentence, about ${Math.round(m.complexShare * 100)}% of sentences contain a subordinate clause.`;
  return `Task prompt:\n${prompt}\n\nEssay:\n${essay}\n\n${facts}\n\nRespond with a json object with keys: task_type ("task2"), criteria {task_response, coherence_cohesion, lexical_resource, grammatical_range_accuracy: {rationale, estimated_band, evidence[{excerpt, issue, explanation, suggested_correction}], strengths[], next_steps[]}}, skill_evidence[{skill_code, evidence_status (needs_practice|ok|insufficient_data), confidence, score}], vocabulary_suggestions[{term, meaning, example}], needs_teacher_review (boolean).`;
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

/** Conservative caps from objective measurements, so an over-generous model reading cannot push a band above what the text shows. */
export function applyCaps(a: Assessment, m: Metrics): Assessment {
  const notes: string[] = [];
  const cap = (key: keyof Assessment["criteria"], max: number, why: string, label: string) => {
    const c = a.criteria[key];
    if (c.estimated_band > max) { notes.push(`${label} adjusted from ${c.estimated_band} to ${max}: ${why}`); c.estimated_band = max; }
  };
  if (m.words < 200) cap("task_response", 5, `the essay has ${m.words} words (minimum 250).`, "Task Response");
  else if (m.words < 250) cap("task_response", 5.5, `the essay has ${m.words} words (minimum 250).`, "Task Response");
  // Calibrated on examiner-written model answers: strong essays scored 0.22-0.55 on this rough measure, so only an extreme value is a safe signal.
  if (m.complexShare < 0.12) cap("grammatical_range_accuracy", 5.5, `almost no sentences (${Math.round(m.complexShare * 100)}%) use complex structures.`, "Grammar");
  return notes.length ? { ...a, calibration_notes: notes } : a;
}
