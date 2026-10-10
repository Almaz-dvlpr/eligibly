import { z } from "zod";

const Criterion = z.object({
  estimated_band: z.number().min(0).max(9),
  evidence: z.array(z.object({ excerpt: z.string(), issue: z.string(), explanation: z.string() })).max(6),
  strengths: z.array(z.string()).max(4),
  next_steps: z.array(z.string()).max(4),
});

export const AssessmentSchema = z.object({
  task_type: z.literal("task2"),
  criteria: z.object({
    task_response: Criterion,
    coherence_cohesion: Criterion,
    lexical_resource: Criterion,
    grammatical_range_accuracy: Criterion,
  }),
  skill_evidence: z.array(z.object({
    skill_code: z.string(),
    evidence_status: z.enum(["needs_practice", "ok", "insufficient_data"]),
    confidence: z.number().min(0).max(1),
  })),
  needs_teacher_review: z.boolean(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export const SYSTEM_PROMPT = `You assess IELTS Writing Task 2 essays against the four public band descriptors.
Return ONLY a json object matching the schema. Every issue must quote an exact excerpt from the essay.
If there is too little text to judge a criterion, say so in next_steps, use skill_evidence status "insufficient_data" and set needs_teacher_review true.
Bands are estimates, not official scores. Skill codes: TR-01..03, CC-01..02, LR-01, GRA-01..02.`;

export function demoAssessment(): Assessment {
  const c = (band: number) => ({ estimated_band: band, evidence: [], strengths: [], next_steps: ["Demo mode: добавьте DEEPSEEK_API_KEY для реальной проверки."] });
  return {
    task_type: "task2",
    criteria: { task_response: c(6), coherence_cohesion: c(6), lexical_resource: c(6), grammatical_range_accuracy: c(6) },
    skill_evidence: [{ skill_code: "TR-02", evidence_status: "insufficient_data", confidence: 0 }],
    needs_teacher_review: true,
  };
}

export function userMessage(prompt: string, essay: string): string {
  return `Task prompt:\n${prompt}\n\nEssay:\n${essay}\n\nRespond with a json object with keys: task_type ("task2"), criteria {task_response, coherence_cohesion, lexical_resource, grammatical_range_accuracy: {estimated_band, evidence[{excerpt, issue, explanation}], strengths[], next_steps[]}}, skill_evidence[{skill_code, evidence_status (needs_practice|ok|insufficient_data), confidence}], needs_teacher_review (boolean).`;
}
