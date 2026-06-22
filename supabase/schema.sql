-- =============================================================================
-- Devex prototype — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query -> Run).
-- Safe to re-run: it drops and recreates policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES — one row per auth user, holds the chosen user type.
-- "Creator" and "Solver" are the *default landing* role. Both can do anything.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  user_type   text not null default 'solver' check (user_type in ('creator', 'solver')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TASKS — published by creators into the marketplace.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references public.profiles (id) on delete cascade,
  title               text not null,
  summary             text not null default '',
  description         text not null default '',
  role                text not null default '',          -- e.g. Backend, DevOps, QA
  domain              text not null default '',          -- e.g. e-commerce, fintech
  difficulty          text not null default 'Junior',    -- Junior / Middle / Senior
  price               numeric not null default 0,
  starter_repo_url    text not null default '',
  acceptance_criteria text not null default '',
  review_rubric       text not null default '',
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PURCHASES — mock "buy". One row = a solver unlocked a task.
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  solver_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (task_id, solver_id)
);

-- ---------------------------------------------------------------------------
-- SUBMISSIONS — solver uploads completed work; creator reviews it.
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks (id) on delete cascade,
  solver_id     uuid not null references public.profiles (id) on delete cascade,
  file_paths    text[] not null default '{}',  -- paths in the 'submissions' storage bucket (1..5)
  file_names    text[] not null default '{}',  -- original file names, aligned with file_paths
  notes         text not null default '',      -- solver's explanation
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  score         integer,                       -- 0..100, set by creator on review
  feedback      text not null default '',
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user signs up.
-- user_type + full_name are passed via auth metadata at signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'solver')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles    enable row level security;
alter table public.tasks       enable row level security;
alter table public.purchases   enable row level security;
alter table public.submissions enable row level security;

-- PROFILES -------------------------------------------------------------------
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- TASKS ----------------------------------------------------------------------
drop policy if exists "tasks readable by authenticated" on public.tasks;
create policy "tasks readable by authenticated"
  on public.tasks for select to authenticated using (true);

drop policy if exists "tasks insert own" on public.tasks;
create policy "tasks insert own"
  on public.tasks for insert to authenticated with check (auth.uid() = creator_id);

drop policy if exists "tasks update own" on public.tasks;
create policy "tasks update own"
  on public.tasks for update to authenticated using (auth.uid() = creator_id);

drop policy if exists "tasks delete own" on public.tasks;
create policy "tasks delete own"
  on public.tasks for delete to authenticated using (auth.uid() = creator_id);

-- PURCHASES ------------------------------------------------------------------
-- Solver sees their own purchases; task creator sees purchases of their tasks.
drop policy if exists "purchases readable by participant" on public.purchases;
create policy "purchases readable by participant"
  on public.purchases for select to authenticated
  using (
    auth.uid() = solver_id
    or auth.uid() in (select creator_id from public.tasks where tasks.id = purchases.task_id)
  );

drop policy if exists "purchases insert own" on public.purchases;
create policy "purchases insert own"
  on public.purchases for insert to authenticated with check (auth.uid() = solver_id);

-- SUBMISSIONS ----------------------------------------------------------------
-- Visible to the solver who made it and the creator of the task.
drop policy if exists "submissions readable by participant" on public.submissions;
create policy "submissions readable by participant"
  on public.submissions for select to authenticated
  using (
    auth.uid() = solver_id
    or auth.uid() in (select creator_id from public.tasks where tasks.id = submissions.task_id)
  );

drop policy if exists "submissions insert own" on public.submissions;
create policy "submissions insert own"
  on public.submissions for insert to authenticated with check (auth.uid() = solver_id);

-- Only the task creator can review (update score/feedback/status).
drop policy if exists "submissions update by task creator" on public.submissions;
create policy "submissions update by task creator"
  on public.submissions for update to authenticated
  using (auth.uid() in (select creator_id from public.tasks where tasks.id = submissions.task_id));

-- =============================================================================
-- STORAGE — private bucket for uploaded submission files (PDF / ZIP / etc.)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- Authenticated users may upload into their own folder ({uid}/...).
drop policy if exists "submissions upload own folder" on storage.objects;
create policy "submissions upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- A user can read files they own (their own folder).
drop policy if exists "submissions read own folder" on storage.objects;
create policy "submissions read own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- A task creator can read (and sign URLs for) files submitted to their tasks.
drop policy if exists "submissions read for task creator" on storage.objects;
create policy "submissions read for task creator"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and exists (
      select 1
      from public.submissions s
      join public.tasks t on t.id = s.task_id
      where t.creator_id = auth.uid()
        and storage.objects.name = any (s.file_paths)
    )
  );
