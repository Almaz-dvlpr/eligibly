-- Step 2: core schema (see ТЗ §5). RLS is enabled on every table.
create extension if not exists vector;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table teacher_students (
  teacher_id uuid references profiles on delete cascade,
  student_id uuid references profiles on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, student_id)
);
create table skills (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name text not null, description text,
  criterion text not null, parent_skill_id uuid references skills, version int not null default 1
);
create table skill_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  skill_id uuid not null references skills,
  mastery_score real not null default 0, confidence_score real not null default 0,
  status text not null default 'unassessed', attempt_count int not null default 0,
  last_assessed_at timestamptz, updated_at timestamptz not null default now(),
  unique (student_id, skill_id)
);
create table sources (
  id uuid primary key default gen_random_uuid(),
  title text not null, author text, source_type text, license_status text,
  source_path text, content_hash text, indexed_at timestamptz, created_at timestamptz not null default now()
);
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources on delete cascade,
  chunk_index int not null, chapter text, page_reference text, content text not null, summary text,
  skill_codes text[] not null default '{}', difficulty int, embedding vector(1536), metadata_json jsonb
);
create table submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  task_prompt text not null, version_number int not null default 1,
  essay_text text not null, word_count int not null, status text not null default 'submitted',
  submitted_at timestamptz not null default now()
);
create table assessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions on delete cascade,
  model_identifier text, rubric_version text, scores_json jsonb not null,
  overall_feedback text, confidence_json jsonb, created_at timestamptz not null default now()
);
create table learning_actions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  skill_id uuid references skills, action_type text not null, reason_json jsonb,
  priority int not null default 0, status text not null default 'pending',
  due_at timestamptz, completed_at timestamptz
);
create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid, operation_type text,
  model_identifier text, input_tokens int, output_tokens int, estimated_cost numeric,
  status text, created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table teacher_students enable row level security;
alter table skill_mastery enable row level security;
alter table submissions enable row level security;
alter table assessments enable row level security;
alter table learning_actions enable row level security;
alter table ai_usage_logs enable row level security;

create policy own_profile on profiles for select using (id = auth.uid());
create policy own_submissions on submissions for select using (student_id = auth.uid());
create policy teacher_submissions on submissions for select using (
  exists (select 1 from teacher_students t where t.teacher_id = auth.uid() and t.student_id = submissions.student_id));
create policy own_assessments on assessments for select using (
  exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));
create policy own_mastery on skill_mastery for select using (student_id = auth.uid());
create policy own_actions on learning_actions for select using (student_id = auth.uid());
-- Writes to mastery/assessments go through the server (service role) only.
