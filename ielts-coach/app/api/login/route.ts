import { COOKIE, tokenFor } from "@/lib/access";

let fails = 0;
let windowStart = 0;

export async function POST(req: Request) {
  const code = process.env.ACCESS_CODE;
  if (!code) return Response.json({ ok: true });
  const now = Date.now();
  if (now - windowStart > 15 * 60_000) { windowStart = now; fails = 0; }
  if (fails >= 10) return Response.json({ error: "Слишком много попыток, подождите 15 минут." }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (typeof body?.code !== "string" || body.code !== code) {
    fails++;
    return Response.json({ error: "Неверный код." }, { status: 401 });
  }
  const res = Response.json({ ok: true });
  res.headers.append("set-cookie", `${COOKIE}=${await tokenFor(code)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
  return res;
}
