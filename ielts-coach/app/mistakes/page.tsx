import { requireUser } from "@/lib/supabase/server";

export default async function Mistakes() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("mistake_journal").select("id, error_type, normalized_description, occurrence_count, last_seen_at, skills(code, name)").eq("student_id", user.id).order("occurrence_count", { ascending: false });
  return (
    <>
      <h1>Журнал ошибок</h1>
      {!data?.length ? <p className="muted">Пока пусто — ошибки появятся после первой проверки.</p> : (
        <table>
          <thead><tr><th>Ошибка</th><th>Критерий</th><th>Раз</th><th>Последний раз</th></tr></thead>
          <tbody>{data.map((m: any) => (
            <tr key={m.id}><td>{m.normalized_description}</td><td>{m.error_type}</td><td>{m.occurrence_count}</td><td>{new Date(m.last_seen_at).toLocaleDateString("ru-RU")}</td></tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
}
