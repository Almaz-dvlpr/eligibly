import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IELTS Writing Coach",
  description: "Персональный тренер по IELTS Writing Task 2: проверка эссе, карта навыков и индивидуальный план.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="ru">
      <body>
        <nav>
          <Link href="/"><b>IELTS Writing Coach</b></Link>
          {user ? (
            <>
              <Link href="/dashboard">Кабинет</Link>
              <Link href="/writing/new">Новое эссе</Link>
              <Link href="/history">История</Link>
              <Link href="/skills">Навыки</Link>
              <Link href="/mistakes">Ошибки</Link>
              <Link href="/learning-plan">План</Link>
              <form action="/auth/logout" method="post"><button className="link">Выйти</button></form>
            </>
          ) : (
            <>
              <Link href="/login">Войти</Link>
              <Link href="/register">Регистрация</Link>
            </>
          )}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
