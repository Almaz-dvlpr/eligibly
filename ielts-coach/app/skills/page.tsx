import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { assessedEssays, criterionBand, criterionTrend, skillRows, skillTrends } from "@/lib/data";
import { CRITERIA, SKILLS } from "@/lib/skills";
import { confidenceLabel } from "@/lib/levels";
import LevelPill from "@/components/LevelPill";

const arrow = (d: number) => (d > 0.04 ? "▲" : d < -0.04 ? "▼" : "▬");

export default async function Skills() {
  const { supabase, user } = await requireUser();
  const [essays, rows, trends] = await Promise.all([assessedEssays(supabase, user.id), skillRows(supabase, user.id), skillTrends(supabase, user.id)]);
  const byCode = new Map(rows.map((r) => [r.code, r]));
  return (
    <>
      <h1>My Writing Skills</h1>
      <p className="muted">The four IELTS criteria, with the skills inside each. Skill levels are labels from our own tracking, not IELTS bands.</p>
      {CRITERIA.map((c) => {
        const t = criterionTrend(essays, c.key);
        return (
          <section className="card" key={c.key}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><b>{c.label}</b><div className="muted"><small>{c.blurb}</small></div></div>
              <div style={{ textAlign: "right" }}><span className="band">{criterionBand(essays, c.key)?.toFixed(1) ?? "—"}</span>{essays.length > 1 && <small className="muted"> {arrow(t)} {t > 0 ? "+" : ""}{t.toFixed(1)}</small>}</div>
            </div>
            {SKILLS.filter((s) => s.criterion === c.key).map((s) => {
              const r = byCode.get(s.code);
              return (
                <div key={s.code} style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span><b>{s.name}</b> <small className="muted">{s.code}</small></span>
                    {r ? <LevelPill status={r.status} score={r.score} /> : <span className="muted"><small>Not assessed yet</small></span>}
                  </div>
                  <div className="muted"><small>{s.description}</small></div>
                  {r && (
                    <>
                      <div className="bar" style={{ margin: "6px 0 2px" }} role="img" aria-label={`${Math.round(r.score * 100)} out of 100`}><i style={{ width: `${Math.round(r.score * 100)}%` }} /></div>
                      <small className="muted">{arrow(trends.get(s.code) ?? 0)} Based on {r.n} essay{r.n === 1 ? "" : "s"} · confidence {confidenceLabel(r.confidence, r.n)}</small>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
      <p><Link href="/mistakes">Patterns to polish →</Link></p>
    </>
  );
}
