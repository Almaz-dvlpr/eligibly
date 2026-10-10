"use client";
import { useState } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    const sb = browserClient();
    if (mode === "register") {
      if (password.length < 8) { setError("Пароль — минимум 8 символов."); setBusy(false); return; }
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { display_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) location.href = "/dashboard";
      else setInfo("Мы отправили письмо со ссылкой подтверждения. Перейдите по ней, чтобы войти.");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setError(error.message === "Invalid login credentials" ? "Неверная почта или пароль." : error.message);
      else location.href = "/dashboard";
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 380 }}>
      <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
      {mode === "register" && (<><label htmlFor="n">Имя</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} required /></>)}
      <label htmlFor="e">Email</label>
      <input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <label htmlFor="p">Пароль</label>
      <input id="p" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <p><button className="btn" disabled={busy}>{busy ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}</button></p>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      {info && <p className="card">{info}</p>}
      <p className="muted">{mode === "login" ? <>Нет аккаунта? <Link href="/register">Регистрация</Link></> : <>Уже есть аккаунт? <Link href="/login">Войти</Link></>}</p>
    </form>
  );
}
