import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS Writing Coach",
  description: "Персональный тренер по IELTS Writing Task 2: проверка эссе, карта навыков и индивидуальный план.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <nav>
          <b>IELTS Writing Coach</b>
          <Link href="/dashboard">Кабинет</Link>
          <Link href="/writing/new">Новое эссе</Link>
          <Link href="/skills">Навыки</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
