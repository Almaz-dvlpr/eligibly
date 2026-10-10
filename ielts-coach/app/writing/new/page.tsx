import EssayForm from "@/components/EssayForm";
import { TOPICS } from "@/lib/topics";

export default async function NewEssay({ searchParams }: { searchParams: Promise<{ topic?: string; q?: string }> }) {
  const sp = await searchParams;
  const t = TOPICS.find((x) => x.id === Number(sp.topic)) ?? TOPICS[0];
  const q = t.questions.find((x) => x.n === Number(sp.q))?.n ?? 1;
  return <EssayForm topics={TOPICS} initialTopic={t.id} initialQ={q} />;
}
