-- =============================================================================
-- Allow a submission to carry multiple files (up to 5, enforced in app code).
-- Replaces the single file_path/file_name columns with text[] arrays.
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query -> Run).
-- =============================================================================

alter table public.submissions
  add column if not exists file_paths text[] not null default '{}',
  add column if not exists file_names text[] not null default '{}';

-- Backfill any existing single-file rows into the arrays.
update public.submissions
set file_paths = array[file_path],
    file_names = array[file_name]
where array_length(file_paths, 1) is null
  and file_path is not null;

-- The creator's storage-read policy referenced the old file_path column.
-- Recreate it to match ANY file in the new array.
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

-- Drop the now-unused single-file columns.
alter table public.submissions drop column if exists file_path;
alter table public.submissions drop column if exists file_name;
