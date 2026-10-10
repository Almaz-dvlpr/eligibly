"use client";
import { useEffect, useRef, useState } from "react";
import { CRITERIA, type CriterionKey } from "@/lib/skills";

export type ChartPoint = { id: string; date: string; overall: number; bands: Record<CriterionKey, number> };

const T = 24, B = 54;
// Marker shapes and dashes differ per criterion so the lines can be told apart without relying on colour.
const STYLE: Record<CriterionKey, { color: string; dash: string; shape: "circle" | "square" | "diamond" | "triangle" }> = {
  task_response: { color: "var(--c-tr)", dash: "6 4", shape: "square" },
  coherence_cohesion: { color: "var(--c-cc)", dash: "2 4", shape: "diamond" },
  lexical_resource: { color: "var(--c-lr)", dash: "8 3 2 3", shape: "triangle" },
  grammatical_range_accuracy: { color: "var(--c-gra)", dash: "10 5", shape: "circle" },
};

function Marker({ shape, x, y, r, fill, stroke }: { shape: string; x: number; y: number; r: number; fill: string; stroke?: string }) {
  const p = { fill, stroke, strokeWidth: stroke ? 2 : 0 };
  if (shape === "square") return <rect x={x - r} y={y - r} width={2 * r} height={2 * r} {...p} />;
  if (shape === "diamond") return <polygon points={`${x},${y - r * 1.3} ${x + r * 1.3},${y} ${x},${y + r * 1.3} ${x - r * 1.3},${y}`} {...p} />;
  if (shape === "triangle") return <polygon points={`${x},${y - r * 1.25} ${x + r * 1.2},${y + r} ${x - r * 1.2},${y + r}`} {...p} />;
  return <circle cx={x} cy={y} r={r} {...p} />;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function ProgressChart({ points, target }: { points: ChartPoint[]; target?: number }) {
  // Drawn at the real container width (not scaled down), so text stays readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const W = Math.max(300, Math.min(width, 900));
  const small = W < 520;
  const H = small ? 300 : 340, L = small ? 32 : 44, R = small ? 76 : 96;
  const PAD = small ? 20 : 28; // keeps the first and last points off the axis and away from the target label
  const [hidden, setHidden] = useState<Set<CriterionKey>>(new Set());
  const [active, setActive] = useState<number | null>(null);
  const shown = CRITERIA.filter((c) => !hidden.has(c.key));

  // The scale follows the data, so low bands (even 2-3) stay visible instead of falling off a fixed 4-9 axis.
  const values = [...points.map((p) => p.overall), ...shown.flatMap((c) => points.map((p) => p.bands[c.key])), ...(target ? [target] : [])];
  let lo = Math.max(0, Math.floor(Math.min(...values) - 0.5));
  let hi = Math.min(9, Math.ceil(Math.max(...values) + 0.5));
  while (hi - lo < 4) { if (lo > 0) lo--; if (hi - lo < 4 && hi < 9) hi++; if (lo === 0 && hi === 9) break; }
  const ticks: number[] = []; for (let v = lo; v <= hi; v++) ticks.push(v);

  const n = points.length;
  const x = (i: number) => (n === 1 ? (L + W - R) / 2 : L + PAD + (i * (W - L - R - 2 * PAD)) / (n - 1));
  const y = (v: number) => T + ((hi - v) * (H - T - B)) / (hi - lo);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 46)))); // thin out x labels when there are many essays
  const toggle = (k: CriterionKey) => setHidden((s) => { const c = new Set(s); c.has(k) ? c.delete(k) : c.add(k); return c; });
  const overallPath = path(points.map((p) => p.overall));
  const a = active !== null ? points[active] : null;

  return (
    <div ref={box}>
      <div className="chips" role="group" aria-label="Lines to show">
        <span className="chart-chip static"><svg width="26" height="10" aria-hidden><line x1="0" x2="26" y1="5" y2="5" stroke="var(--primary)" strokeWidth="3.5" /></svg> Overall</span>
        {CRITERIA.map((c) => {
          const st = STYLE[c.key]; const on = !hidden.has(c.key);
          return (
            <button key={c.key} type="button" className={`chart-chip${on ? "" : " off"}`} aria-pressed={on} onClick={() => toggle(c.key)} title={c.label}>
              <svg width="26" height="12" aria-hidden><line x1="0" x2="26" y1="6" y2="6" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash} /><Marker shape={st.shape} x={13} y={6} r={3.2} fill={st.color} /></svg> {c.short}
            </button>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Estimated band for each of your ${n} essays, from ${lo} to ${hi}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" style={{ fontSize: 13 }}>{v}</text>
          </g>
        ))}
        <text x={4} y={T - 8} style={{ fontSize: 12 }}>Band</text>

        {target !== undefined && target >= lo && target <= hi && (
          <g>
            <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke="var(--focus)" strokeWidth="1.8" strokeDasharray="7 5" />
            <text x={W - R + 6} y={y(target) + 4} style={{ fontSize: 13, fill: "var(--focus)", fontWeight: 600 }}>Target {target.toFixed(1)}</text>
          </g>
        )}

        {n > 1 && <path d={`${overallPath} L${x(n - 1)},${y(lo)} L${x(0)},${y(lo)} Z`} fill="var(--primary)" opacity=".07" />}

        {shown.map((c) => {
          const st = STYLE[c.key];
          return (
            <g key={c.key} opacity=".85">
              {n > 1 && <path d={path(points.map((p) => p.bands[c.key]))} fill="none" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash} strokeLinejoin="round" />}
              {points.map((p, i) => <Marker key={p.id} shape={st.shape} x={x(i)} y={y(p.bands[c.key])} r={3.6} fill={st.color} />)}
            </g>
          );
        })}

        {n > 1 && <path d={overallPath} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.overall)} r="6" fill="var(--card)" stroke="var(--primary)" strokeWidth="3" />
            {i % step === 0 && (
              <g>
                <text x={x(i)} y={H - 28} textAnchor="middle" style={{ fontSize: 13, fill: "var(--fg)" }}>#{i + 1}</text>
                <text x={x(i)} y={H - 11} textAnchor="middle" style={{ fontSize: 11 }}>{fmt(p.date)}</text>
              </g>
            )}
            <circle cx={x(i)} cy={y(p.overall)} r="16" fill="transparent" tabIndex={0} role="button" aria-label={`Essay ${i + 1}, ${fmt(p.date)}: overall ${p.overall.toFixed(1)}`}
              style={{ cursor: "pointer", outline: "none" }} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} onMouseLeave={() => setActive(null)} onBlur={() => setActive(null)} />
          </g>
        ))}
        {n <= 12 && points.map((p, i) => (
          <text key={"l" + p.id} x={x(i)} y={y(p.overall) - 14} textAnchor="middle" pointerEvents="none"
            style={{ fontSize: 14, fontWeight: 700, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 5, paintOrder: "stroke", strokeLinejoin: "round" }}>{p.overall.toFixed(1)}</text>
        ))}
      </svg>

      <div className="chart-detail" aria-live="polite">
        {a ? (
          <>
            <b>Essay {active! + 1}</b> · {fmt(a.date)} · overall <b>{a.overall.toFixed(1)}</b>
            {CRITERIA.map((c) => <span key={c.key} className="muted"> · {c.short} {a.bands[c.key].toFixed(1)}</span>)}
          </>
        ) : <span className="muted">Hover or tap a point to see the bands for that essay.</span>}
      </div>
      <small className="muted">Practice estimates, not official IELTS scores. The scale adjusts to your results.</small>
    </div>
  );
}
