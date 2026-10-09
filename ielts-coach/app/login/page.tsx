"use client";
import { useState } from "react";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (res.ok) location.href = "/"; else setError((await res.json()).error ?? "Ошибка");
  }
  return (
    <form onSubmit={go}>
      <h1>Вход</h1>
      <p className="muted">Закрытый пилот. Введите код доступа.</p>
      <input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
      <p><button className="btn" type="submit">Войти</button></p>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
    </form>
  );
}
