import { NextRequest, NextResponse } from "next/server";
import { COOKIE, tokenFor } from "@/lib/access";

export async function proxy(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next(); // gate off; /api/assess then stays in demo mode in production
  if (req.cookies.get(COOKIE)?.value === (await tokenFor(code))) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Нужен код доступа." }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!login|api/login|_next/|favicon.ico).*)"] };
