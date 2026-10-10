import { adminClient, serverClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Not configured." }, { status: 503 });
  const { data } = await (await serverClient()).auth.getUser();
  if (!data.user) return Response.json({ error: "Please sign in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const band = Number(body?.target_band);
  if (!(band >= 4 && band <= 9) || (band * 2) % 1 !== 0) return Response.json({ error: "Target band must be 4.0–9.0 in 0.5 steps." }, { status: 400 });
  // Service role is used only for this one validated column; users cannot update profiles (and their role) directly.
  const { error } = await adminClient().from("profiles").update({ target_band: band }).eq("id", data.user.id);
  return error ? Response.json({ error: "Could not save." }, { status: 500 }) : Response.json({ ok: true });
}
