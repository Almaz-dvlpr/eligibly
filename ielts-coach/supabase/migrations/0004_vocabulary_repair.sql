-- Safe to run any number of times. Repairs everything the Vocabulary Bank needs.

-- 1. Every auth user must have a profile row (vocabulary.student_id references profiles).
insert into profiles (id, display_name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- 2. The table.
create table if not exists vocabulary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  term text not null, meaning text, example text,
  created_at timestamptz not null default now(),
  unique (student_id, term)
);

-- 3. Row-level security: each student sees and changes only their own words.
alter table vocabulary enable row level security;
drop policy if exists own_vocab_select on vocabulary;
drop policy if exists own_vocab_insert on vocabulary;
drop policy if exists own_vocab_delete on vocabulary;
create policy own_vocab_select on vocabulary for select using (student_id = auth.uid());
create policy own_vocab_insert on vocabulary for insert with check (student_id = auth.uid());
create policy own_vocab_delete on vocabulary for delete using (student_id = auth.uid());

-- 4. Table privileges for signed-in users.
grant select, insert, delete on vocabulary to authenticated;

-- 5. Make the API see the table right away.
notify pgrst, 'reload schema';
