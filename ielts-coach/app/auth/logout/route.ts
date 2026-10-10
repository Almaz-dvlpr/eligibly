import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (supabaseConfigured()) await (await serverClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
