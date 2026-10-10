import Link from "next/link";
import { notFound } from "next/navigation";
import { QTYPE_LABEL, TOPICS } from "@/lib/topics";

export default async function Topic({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TOPICS.find((x) => x.id === Number(id));
  if (!t) notFound();
  return (
    <>
      <p><Link href="/topics">← All topics</Link></p>
      <h1>{t.en}</h1>
      <p className="muted">{t.ru}</p>
      {t.questions.map((q) => (
        <div className="card" key={q.n}>
          <small className="muted">{QTYPE_LABEL[q.type]}</small>
          <p>{q.text}</p>
          <Link className="btn" href={`/writing/new?topic=${t.id}&q=${q.n}`}>Write essay</Link>
        </div>
      ))}
    </>
  );
}
