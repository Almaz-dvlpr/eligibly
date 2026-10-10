import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { assessedEssays, criterionBand, criterionTrend, currentBand, overall } from "@/lib/data";
import { CRITERIA } from "@/lib/skills";
import ProgressChart from "@/components/ProgressChart";

export default async function Progress() {
  const { supabase, user } = await requireUser();
  const [essays, { data: profile }] = await Promise.all([
    assessedEssays(supabase, user.id),
    supabase.from("profiles").select("target_band").eq("id", user.id).maybeSingle(),
  ]);
  const points = essays.map((e) => ({
    id: e.id, date: e.submitted_at, overall: overall(e.a),
    bands: Object.fromEntries(CRITERIA.map((c) => [c.key, e.a.criteria[c.key].estimated_band])) as Record<(typeof CRITERIA)[number]["key"], number>,
  }));
  const target = profile?.target_band ? Number(profile.target_band) : undefined;
  return (
    <>
      <h1>Writing Progress</h1>
      {essays.length === 0 ? <p className="muted">Your progress chart appears after your first checked essay. <Link href="/writing/new">Write an essay</Link></p> : (
        <>
          <p className="muted">{essays.length < 3 ? "Write a few more essays to see a clearer trend." : "You're moving towards your target. Keep building."}</p>
          <div className="card"><ProgressChart points={points} target={target} /></div>
          <div className="grid">
            {CRITERIA.map((c) => {
              const t = criterionTrend(essays, c.key);
              return <div className="card" key={c.key}><small className="muted">{c.label}</small><div className="band">{criterionBand(essays, c.key)?.toFixed(1)}</div>
                {essays.length > 1 && <small className="muted">{t > 0 ? "▲ +" : t < 0 ? "▼ " : "▬ "}{t.toFixed(1)} since first essay</small>}</div>;
            })}
          </div>
          <p className="muted"><small>Current estimate (average of your last 3 essays): {currentBand(essays)?.toFixed(1)}. Practice estimates only.</small></p>
        </>
      )}
    </>
  );
}
