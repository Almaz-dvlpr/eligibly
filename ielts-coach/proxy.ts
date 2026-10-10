import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/writing", "/skills", "/history", "/mistakes", "/learning-plan"];

export async function proxy(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser(); // refreshes the session cookie
  const path = req.nextUrl.pathname;
  if (!data.user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return res;
}

export const config = { matcher: ["/((?!_next/|favicon.ico).*)"] };
