import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Не просто оценка эссе, а путь к следующему band</h1>
      <p className="muted">Проверка по четырём критериям IELTS → навык, который проседает → материал и упражнение → повторная проверка → обновлённый план.</p>
      <p><Link className="btn" href="/writing/new">Проверить эссе</Link></p>
      <div className="grid">
        <div className="card"><b>Self-study</b><p className="muted">Система сама ведёт по персональному плану.</p></div>
        <div className="card"><b>С преподавателем</b><p className="muted">Преподаватель видит оценки ИИ и может их исправить (в разработке).</p></div>
        <div className="card"><b>Честные оценки</b><p className="muted">Band — оценка-ориентир, не официальный балл IELTS.</p></div>
      </div>
    </>
  );
}
