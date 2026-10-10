import Link from "next/link";
import { currentUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      <h1>Не просто оценка эссе, а путь к следующему band</h1>
      <p className="muted">Проверка по четырём критериям IELTS → навык, который проседает → следующий шаг → повторная проверка → обновлённый план.</p>
      <p>
        {user ? <Link className="btn" href="/dashboard">В кабинет</Link> : <><Link className="btn" href="/register">Создать аккаунт</Link> <Link href="/login">Войти</Link></>}
      </p>
      <div className="grid">
        <div className="card"><b>Self-study</b><p className="muted">Система сама выбирает слабый навык и назначает следующий шаг.</p></div>
        <div className="card"><b>Журнал ошибок</b><p className="muted">Повторяющиеся ошибки собираются в одном месте.</p></div>
        <div className="card"><b>Честные оценки</b><p className="muted">Band — ориентир ИИ, не официальный балл IELTS.</p></div>
      </div>
    </>
  );
}
