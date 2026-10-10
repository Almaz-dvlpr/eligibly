// Parses content/topics.md into lib/topics.json. Run: node scripts/build-topics.mjs
import { readFileSync, writeFileSync } from "node:fs";

const md = readFileSync(new URL("../content/topics.md", import.meta.url), "utf8");
const typeOf = (q) => {
  if (/Discuss both views/i.test(q)) return "discuss";
  if (/To what extent do you agree or disagree/i.test(q)) return "opinion";
  if (/outweigh/i.test(q)) return "advantages";
  if (/positive or negative/i.test(q)) return "positive_negative";
  if (/(causes|reasons).*(solutions|measures|effects|problems)|problems.*(solved|solutions)|What problems|solutions/i.test(q)) return "problems_solutions";
  return "two_part";
};
const topics = [];
let cur = null;
for (const line of md.split("\n")) {
  const h = line.match(/^## (\d+)\. (.+?) — (.+)$/);
  if (h) { cur = { id: Number(h[1]), en: h[2].trim(), ru: h[3].trim(), questions: [] }; topics.push(cur); continue; }
  const q = line.match(/^(\d+)\. (.+)$/);
  if (q && cur) cur.questions.push({ n: Number(q[1]), text: q[2].trim(), type: typeOf(q[2]) });
}
if (topics.length !== 52 || topics.some((t) => t.questions.length !== 5)) throw new Error("expected 52 topics x 5 questions");
writeFileSync(new URL("../lib/topics.json", import.meta.url), JSON.stringify(topics, null, 1));
const counts = {};
topics.forEach((t) => t.questions.forEach((q) => (counts[q.type] = (counts[q.type] ?? 0) + 1)));
console.log(topics.length, "topics", topics.length * 5, "questions", counts);
