import type { Assessment } from "@/lib/assess";
import { LABELS } from "@/lib/criteria";

export const avgBand = (a: Assessment) => {
  const v = Object.values(a.criteria).map((c) => c.estimated_band);
  return Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 2) / 2;
};

export default function AssessmentView({ a }: { a: Assessment }) {
  return (
    <>
      <p className="card">Примерный общий band: <span className="band">{avgBand(a).toFixed(1)}</span> <span className="muted">— ориентир, не официальный балл IELTS</span></p>
      <div className="grid">
        {Object.entries(a.criteria).map(([k, c]) => (
          <div className="card" key={k}>
            <small className="muted">{LABELS[k]}</small>
            <div className="band">{c.estimated_band.toFixed(1)}</div>
            {c.strengths.map((s, i) => <p key={i}>✓ {s}</p>)}
            {c.evidence.map((e, i) => <p key={i}><q>{e.excerpt}</q><br /><b>{e.issue}.</b> {e.explanation}</p>)}
            {c.next_steps.map((s, i) => <p className="muted" key={i}>→ {s}</p>)}
          </div>
        ))}
      </div>
      {a.needs_teacher_review && <p className="muted">Рекомендуется проверка преподавателем.</p>}
    </>
  );
}
