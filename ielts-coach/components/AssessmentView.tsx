import Link from "next/link";
import type { Assessment } from "@/lib/assess";
import { CRITERIA } from "@/lib/skills";
import { overall } from "@/lib/data";
import { SaveWord } from "./VocabButtons";

export const avgBand = overall;

export default function AssessmentView({ a, practiceHref, canSave = true }: { a: Assessment; practiceHref?: string; canSave?: boolean }) {
  const highlights = CRITERIA.flatMap((c) => a.criteria[c.key].strengths.map((s) => ({ c: c.short, s })));
  return (
    <>
      <div className="card">
        <small className="muted">Estimated band (practice estimate, not an official IELTS score)</small>
        <div className="big">{overall(a).toFixed(1)}</div>
      </div>
      {highlights.length > 0 && (
        <div className="panel strengths"><h3>Your writing highlights</h3>{highlights.map((h, i) => <p key={i} style={{ margin: ".3em 0" }}>✓ {h.s} <small className="muted">({h.c})</small></p>)}</div>
      )}
      <h2>Let&apos;s make it even stronger</h2>
      <div className="grid wide">
        {CRITERIA.map((c) => {
          const cr = a.criteria[c.key];
          return (
            <div className="card" key={c.key}>
              <small className="muted">{c.label}</small>
              <div className="band">{cr.estimated_band.toFixed(1)}</div>
              {cr.evidence.map((e, i) => (
                <div key={i}>
                  <div className="quote">&ldquo;{e.excerpt}&rdquo;</div>
                  {e.suggested_correction && <div className="better">{e.suggested_correction}</div>}
                  <p style={{ margin: ".2em 0 1em" }}><b>{e.issue}.</b> <span className="muted">{e.explanation}</span></p>
                </div>
              ))}
              {cr.next_steps.map((s, i) => <p className="muted" key={i}>→ {s}</p>)}
            </div>
          );
        })}
      </div>
      {a.vocabulary_suggestions && a.vocabulary_suggestions.length > 0 && (
        <>
          <h2>Useful vocabulary for this topic</h2>
          {a.vocabulary_suggestions.map((v, i) => (
            <div className="card" key={i} style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div><b>{v.term}</b> <span className="muted">— {v.meaning}</span><div className="muted"><small>{v.example}</small></div></div>
              {canSave && <SaveWord term={v.term} meaning={v.meaning} example={v.example} />}
            </div>
          ))}
        </>
      )}
      {a.needs_teacher_review && <p className="muted">A teacher review is recommended for this essay.</p>}
      {practiceHref && <p><Link className="btn" href={practiceHref}>Practise this skill</Link></p>}
    </>
  );
}
