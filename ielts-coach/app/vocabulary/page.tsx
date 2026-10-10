import { requireUser } from "@/lib/supabase/server";
import VocabManager from "@/components/VocabManager";

export default async function Vocabulary() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("vocabulary").select("id, term, meaning, example").eq("student_id", user.id).order("created_at", { ascending: false });
  return (
    <>
      <h1>Vocabulary Bank</h1>
      <p className="muted">Your personal list of useful words and expressions.</p>
      <VocabManager words={data ?? []} />
    </>
  );
}
