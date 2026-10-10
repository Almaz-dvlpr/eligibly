export default function Setup() {
  return (
    <div className="card">
      <b>Accounts are not connected yet</b>
      <p className="muted">The site is running without Supabase. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in Vercel and run the migrations from supabase/migrations.</p>
    </div>
  );
}
