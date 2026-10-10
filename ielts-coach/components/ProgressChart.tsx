import type { Essay } from "@/lib/data";
import { overall } from "@/lib/data";
import { CRITERIA } from "@/lib/skills";

const COLORS = ["#269B86", "#7189C7", "#C19045", "#a35f8f"];

export default function ProgressChart({ essays }: { essays: Essay[] }) {
  const W = 640, H = 260, L = 34, R = 12, T = 12, B = 30;
  const x = (i: number) => (essays.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (essays.length - 1));
  const y = (v: number) => T + ((9 - v) * (H - T - B)) / 5; // scale 4..9
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Band estimates across your essays" style={{ width: "100%", height: "auto" }}>
        {[4, 5, 6, 7, 8, 9].map((v) => (
          <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" opacity=".12" /><text x={4} y={y(v) + 4}>{v}</text></g>
        ))}
        {CRITERIA.map((c, k) => (
          <path key={c.key} d={line(essays.map((e) => e.a.criteria[c.key].estimated_band))} fill="none" stroke={COLORS[k]} strokeWidth="1.5" opacity=".7" strokeDasharray="4 3" />
        ))}
        <path d={line(essays.map((e) => overall(e.a)))} fill="none" stroke="#234B8A" strokeWidth="3" />
        {essays.map((e, i) => (
          <g key={e.id}><circle cx={x(i)} cy={y(overall(e.a))} r="4" fill="#234B8A" /><text x={x(i)} y={H - 10} textAnchor="middle">{i + 1}</text></g>
        ))}
      </svg>
      <p className="chips" style={{ gap: 14 }}>
        <span><b style={{ color: "#234B8A" }}>━</b> Overall</span>
        {CRITERIA.map((c, k) => <span key={c.key} className="muted"><b style={{ color: COLORS[k] }}>╌</b> {c.short}</span>)}
      </p>
      <small className="muted">Numbers under the chart are essay numbers. Practice estimates only.</small>
    </div>
  );
}
