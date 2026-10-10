import Link from "next/link";
import { currentUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      <h1>Your personal IELTS Writing coach</h1>
      <p className="muted">Write on 52 topics, get balanced feedback on all four IELTS criteria, and follow a plan built around your own next step.</p>
      <p>{user ? <Link className="btn" href="/dashboard">Go to dashboard</Link> : <><Link className="btn" href="/register">Create account</Link> <Link href="/login">Sign in</Link></>}</p>
      <div className="grid">
        <div className="panel strengths"><h3>Your strengths</h3>See what you already do well.</div>
        <div className="panel growth"><h3>Growth opportunities</h3>Skills that are taking shape.</div>
        <div className="panel focus"><h3>Next focus</h3>One clear step toward your target band.</div>
      </div>
      <p className="muted">Band estimates are practice estimates by AI, not official IELTS scores.</p>
    </>
  );
}
