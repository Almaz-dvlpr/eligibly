import data from "./topics.json";

export type QType = "opinion" | "discuss" | "advantages" | "problems_solutions" | "positive_negative" | "two_part";
export type Question = { n: number; text: string; type: QType };
export type Topic = { id: number; en: string; ru: string; questions: Question[] };

export const TOPICS = data as Topic[];

export const QTYPE_LABEL: Record<QType, string> = {
  opinion: "Agree / Disagree", discuss: "Discuss both views", advantages: "Advantages & Disadvantages",
  problems_solutions: "Problems & Solutions", positive_negative: "Positive / Negative", two_part: "Two-part question",
};

// Which question type trains which skill best.
export const SKILL_QTYPE: Record<string, QType> = {
  "TR-01": "two_part", "TR-02": "opinion", "TR-03": "discuss", "CC-01": "advantages",
  "CC-02": "problems_solutions", "LR-01": "positive_negative", "GRA-01": "discuss", "GRA-02": "opinion",
};

export const ALL_QUESTIONS = new Set(TOPICS.flatMap((t) => t.questions.map((q) => q.text)));

export function findQuestion(topicId: number, n: number) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const q = topic?.questions.find((x) => x.n === n);
  return topic && q ? { topic, q } : null;
}

/** Picks a not-yet-written question of the type that trains the skill. */
export function recommend(skillCode: string, done: Set<string>, seed = Date.now()) {
  const type = SKILL_QTYPE[skillCode] ?? "opinion";
  const all = TOPICS.flatMap((t) => t.questions.map((q) => ({ topic: t, q })));
  const fresh = all.filter((x) => !done.has(x.q.text));
  const pool = fresh.filter((x) => x.q.type === type);
  const from = pool.length ? pool : fresh.length ? fresh : all;
  return from[Math.floor(seed / 86_400_000) % from.length]; // stable for a day
}

export const writeHref = (r: { topic: Topic; q: Question }) => `/writing/new?topic=${r.topic.id}&q=${r.q.n}`;
