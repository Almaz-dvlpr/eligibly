import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IELTS Writing Coach",
  description: "Practise IELTS Writing Task 2 with 52 topics, balanced feedback and a personal learning plan.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/"><b>IELTS Writing Coach</b></Link>
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/skills">My Writing Skills</Link>
              <Link href="/topics">Practice Topics</Link>
              <Link href="/history">My Essays</Link>
              <Link href="/progress">Progress</Link>
              <Link href="/learning-plan">Learning Plan</Link>
              <Link href="/vocabulary">Vocabulary</Link>
              <form action="/auth/logout" method="post"><button className="link">Sign out</button></form>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register">Create account</Link>
            </>
          )}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
