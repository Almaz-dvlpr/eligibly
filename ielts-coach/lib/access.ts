// Shared access-code gate (stopgap until Supabase auth). Cookie holds a hash, never the code.
export async function tokenFor(code: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ielts-coach:" + code));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const COOKIE = "ielts_access";
