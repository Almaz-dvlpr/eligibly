import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { assessedEssays, currentBand, criterionBand, overall, skillRows } from "@/lib/data";
import { CRITERIA, SKILLS, skillByCode } from "@/lib/skills";
import { recommend, writeHref } from "@/lib/topics";
import TargetForm from "@/components/TargetForm";

export default async function Dashboard() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, essays, rows, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("display_name, target_band").eq("id", user.id).maybeSingle(),
    assessedEssays(supabase, user.id),
    skillRows(supabase, user.id),
    supabase.from("submissions").select("task_prompt").eq("student_id", user.id),
  ]);
  const target = Number(profile?.target_band ?? 7);
  const band = currentBand(essays);
  const delta = essays.length >= 2 ? band! - overall(essays[0].a) : null;
  const done = new Set((subs ?? []).map((s) => s.task_prompt as string));

  const ranked = rows.map((r) => ({ ...r, skill: skillByCode(r.code)! })).filter((r) => r.skill).sort((a, b) => b.score - a.score);
  const strengths = ranked.slice(0, 2);
  const focus = ranked.length ? ranked[ranked.length - 1] : null;
  const growth = ranked.slice(2, -1).slice(-2);
  const practice = focus ? recommend(focus.code, done) : null;

  return (
    <>
      <h1>Welcome back, {profile?.display_name ?? "writer"}!</h1>
      <p className="muted">
        {essays.length === 0 ? "Write your first essay and we will map your strengths and your next step."
          : delta !== null && delta > 0 ? "You're making steady progress. Here is what your writing journey looks like today."
          : "Every essay adds to the picture. Here is where you stand today."}
      </p>

      <div className="hero">
        <div className="card">
          <small className="muted">Current estimated band</small>
          <div className="big">{band ? band.toFixed(1) : "—"}</div>
          {delta !== null && <small className="muted">{delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} since your first essay</small>}
        </div>
        <div className="card">
          <small className="muted">Target band</small>
          <div className="big">{target.toFixed(1)}</div>
          <TargetForm value={target} />
        </div>
      </div>

      {essays.length > 0 && (
        <>
          <h2>Your writing skills</h2>
          <div className="grid">
            {CRITERIA.map((c) => (
              <div className="card" key={c.key}><small className="muted">{c.label}</small><div className="band">{criterionBand(essays, c.key)?.toFixed(1)}</div></div>
            ))}
          </div>
        </>
      )}

      <div className="grid wide" style={{ marginTop: 18 }}>
        <div className="panel strengths"><h3>What you&apos;re doing well</h3>
          {strengths.length ? strengths.map((r) => <p key={r.code} style={{ margin: ".3em 0" }}>✓ {r.skill.praise}</p>) : <p className="muted" style={{ margin: 0 }}>Your first essay will reveal your strengths.</p>}
        </div>
        <div className="panel growth"><h3>Growth opportunities</h3>
          {growth.length ? growth.map((r) => <p key={r.code} style={{ margin: ".3em 0" }}>{r.skill.tip}</p>) : <p className="muted" style={{ margin: 0 }}>Skills that are taking shape will appear here.</p>}
        </div>
        <div className="panel focus"><h3>Your next growth opportunity</h3>
          {focus ? <><p style={{ margin: ".3em 0" }}><b>{focus.skill.name}.</b> {focus.skill.practice}</p>{practice && <p><Link className="btn" href={writeHref(practice)}>Start focused practice</Link></p>}</>
            : <p style={{ margin: 0 }}><Link className="btn" href="/writing/new">Write your first essay</Link></p>}
        </div>
      </div>
      <p className="muted"><small>{SKILLS.length} skills tracked. Estimated bands are practice estimates, not official IELTS scores.</small></p>
    </>
  );
}
