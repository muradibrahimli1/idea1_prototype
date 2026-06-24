-- =============================================================================
-- Admin role: a flag on profiles, a helper function, and read-everything
-- policies so an admin can see all tasks / submissions / purchases / files.
-- Run in the Supabase SQL Editor (Dashboard -> SQL -> New query -> Run).
-- =============================================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- SECURITY DEFINER so it reads profiles without tripping RLS (no recursion).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admins can read every submission (added alongside the existing
-- solver/creator policies — multiple SELECT policies are OR'd together).
drop policy if exists "submissions readable by admin" on public.submissions;
create policy "submissions readable by admin"
  on public.submissions for select to authenticated
  using (public.is_admin());

-- Admins can read every purchase.
drop policy if exists "purchases readable by admin" on public.purchases;
create policy "purchases readable by admin"
  on public.purchases for select to authenticated
  using (public.is_admin());

-- Admins can read every submission file (to generate signed download URLs).
drop policy if exists "submissions read for admin" on storage.objects;
create policy "submissions read for admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Make yourself an admin: replace the email with the account you log in with.
-- ---------------------------------------------------------------------------
-- update public.profiles set is_admin = true where email = 'you@example.com';
