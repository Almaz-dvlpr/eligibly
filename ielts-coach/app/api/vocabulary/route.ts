import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

async function auth() {
  if (!supabaseConfigured()) return null;
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const a = await auth();
  if (!a) return Response.json({ error: "Please sign in." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const term = clean(b?.term, 80);
  if (!term) return Response.json({ error: "Enter a word or phrase." }, { status: 400 });
  // Plain insert: an upsert would also need an UPDATE policy, which this table does not have.
  const { error } = await a.supabase.from("vocabulary").insert(
    { student_id: a.user.id, term, meaning: clean(b?.meaning, 300) || null, example: clean(b?.example, 300) || null });
  if (error?.code === "23505") return Response.json({ ok: true, duplicate: true }); // already in the bank
  if (error) {
    console.error("vocabulary insert failed:", error.code, error.message);
    const hint = error.code === "42P01" ? "The database is missing the vocabulary table: run migration 0003_cabinet.sql in Supabase." : `Could not save (${error.code ?? "error"}).`;
    return Response.json({ error: hint }, { status: 500 });
  }
  revalidatePath("/vocabulary");
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const a = await auth();
  if (!a) return Response.json({ error: "Please sign in." }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (typeof b?.id !== "string") return Response.json({ error: "Bad request." }, { status: 400 });
  await a.supabase.from("vocabulary").delete().eq("id", b.id).eq("student_id", a.user.id);
  revalidatePath("/vocabulary");
  return Response.json({ ok: true });
}
