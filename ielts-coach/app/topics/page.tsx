import Link from "next/link";
import { TOPICS } from "@/lib/topics";

export default function Topics() {
  return (
    <>
      <h1>Practice Topics</h1>
      <p className="muted">52 topics · 260 practice questions. Pick a topic, choose one of five questions and write. These are original practice questions, not an official list of past exam questions.</p>
      <div className="grid">
        {TOPICS.map((t) => (
          <Link key={t.id} href={`/topics/${t.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <small className="muted">Topic {t.id}</small>
            <div><b>{t.en}</b></div>
            <div className="muted"><small>{t.ru}</small></div>
          </Link>
        ))}
      </div>
    </>
  );
}
