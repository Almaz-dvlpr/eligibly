-- Graded skill history, target band, personal vocabulary.
alter table profiles add column if not exists target_band numeric(2,1) not null default 7.0;

create table if not exists skill_assessment_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  skill_id uuid not null references skills,
  submission_id uuid not null references submissions on delete cascade,
  score real not null check (score between 0 and 1),
  confidence real not null check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (submission_id, skill_id)
);
create index if not exists sae_student_skill on skill_assessment_events (student_id, skill_id, created_at desc);
alter table skill_assessment_events enable row level security;
create policy own_events on skill_assessment_events for select using (student_id = auth.uid());

create table if not exists vocabulary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  term text not null, meaning text, example text,
  created_at timestamptz not null default now(),
  unique (student_id, term)
);
alter table vocabulary enable row level security;
create policy own_vocab_select on vocabulary for select using (student_id = auth.uid());
create policy own_vocab_insert on vocabulary for insert with check (student_id = auth.uid());
create policy own_vocab_delete on vocabulary for delete using (student_id = auth.uid());
