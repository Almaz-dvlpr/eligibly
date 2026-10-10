import { requireUser } from "@/lib/supabase/server";
import VocabManager from "@/components/VocabManager";

export const dynamic = "force-dynamic";

export default async function Vocabulary() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("vocabulary").select("id, term, meaning, example").eq("student_id", user.id).order("created_at", { ascending: false });
  return (
    <>
      <h1>Vocabulary Bank</h1>
      <p className="muted">Your personal list of useful words and expressions.</p>
      {error && <p role="alert" style={{ color: "crimson" }}>Could not load your words{error.code === "42P01" ? ": run migration 0003_cabinet.sql in Supabase." : "."}</p>}
      <VocabManager words={data ?? []} />
    </>
  );
}
