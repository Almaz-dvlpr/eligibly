-- Profile auto-creation, mistake journal, seed skills, read policies.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table if not exists mistake_journal (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  skill_id uuid references skills, error_type text, normalized_description text not null,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  occurrence_count int not null default 1, status text not null default 'open',
  unique (student_id, normalized_description)
);
alter table mistake_journal enable row level security;
create policy own_mistakes on mistake_journal for select using (student_id = auth.uid());

alter table skills enable row level security;
create policy skills_read on skills for select to authenticated using (true);

insert into skills (code, name, criterion, description) values
 ('TR-01','Разбор задания','Task Response','Понять тип вопроса и все его части.'),
 ('TR-02','Ясная позиция','Task Response','Чётко сформулировать thesis statement и держать его до конца.'),
 ('TR-03','Развитие аргумента','Task Response','Идея → объяснение → пример.'),
 ('CC-01','Структура абзаца','Coherence & Cohesion','Одна главная мысль на абзац, topic sentence.'),
 ('CC-02','Связки и референции','Coherence & Cohesion','Естественные cohesive devices без переизбытка.'),
 ('LR-01','Точность лексики','Lexical Resource','Подбор слов и коллокаций.'),
 ('GRA-01','Сложные предложения','Grammatical Range & Accuracy','Придаточные, пассив, условные.'),
 ('GRA-02','Базовая точность','Grammatical Range & Accuracy','Времена, артикли, согласование.')
on conflict (code) do nothing;
