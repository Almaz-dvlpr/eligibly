import { SKILLS } from "@/lib/skills";

export default function Skills() {
  return (
    <>
      <h1>Карта навыков</h1>
      <div className="grid">
        {SKILLS.map((s) => (
          <div className="card" key={s.code}>
            <small className="muted">{s.code} · {s.criterion}</small>
            <div><b>{s.name}</b></div>
            <p className="muted">{s.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
