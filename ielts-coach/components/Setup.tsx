export default function Setup() {
  return (
    <div className="card">
      <b>Аккаунты ещё не подключены</b>
      <p className="muted">Сайт запущен без Supabase. Добавьте NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY в настройках Vercel и примените миграции из supabase/migrations.</p>
    </div>
  );
}
