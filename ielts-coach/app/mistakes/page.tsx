import { requireUser } from "@/lib/supabase/server";

export default async function Patterns() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("mistake_journal").select("id, error_type, normalized_description, occurrence_count, last_seen_at").eq("student_id", user.id).order("occurrence_count", { ascending: false });
  return (
    <>
      <h1>Patterns to polish</h1>
      <p className="muted">Things that came up more than once are the quickest wins.</p>
      {!data?.length ? <p className="muted">Nothing here yet — patterns appear after your first checked essay.</p> : (
        <table>
          <thead><tr><th>Pattern</th><th>Criterion</th><th>Seen</th><th>Last seen</th></tr></thead>
          <tbody>{data.map((m: any) => (
            <tr key={m.id}><td>{m.normalized_description}</td><td>{m.error_type}</td><td>{m.occurrence_count}×</td><td>{new Date(m.last_seen_at).toLocaleDateString("en-GB")}</td></tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
}
