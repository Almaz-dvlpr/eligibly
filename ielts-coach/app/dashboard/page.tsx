import Link from "next/link";

export default function Dashboard() {
  return (
    <>
      <h1>Кабинет</h1>
      <div className="card">
        <b>Следующий шаг</b>
        <p className="muted">Пока нет работ. Напишите диагностическое эссе — система определит приоритетный навык.</p>
        <Link className="btn" href="/writing/new">Написать эссе</Link>
      </div>
      <p className="muted">Вход, история работ и учебный план появятся после подключения Supabase (шаг 2).</p>
    </>
  );
}
