-- Private attorney notes on a shared tracked case (docs/spec.md, section 5).
-- Only the author reads and writes them, and only while the case is actively shared with them:
-- the client never sees them, and revoking the share hides them (they reappear if it is shared again).

create table public.attorney_notes (
  id uuid primary key default gen_random_uuid(),
  tracked_case_id uuid not null references public.tracked_cases (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index attorney_notes_by_case on public.attorney_notes (tracked_case_id, author_id, created_at desc);

comment on table public.attorney_notes is 'Private notes an attorney keeps on a case shared with them. Only the author sees them, only while the share is active; the client never does.';

-- updated_at is set by the database, never by the browser.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger attorney_notes_touch_updated_at
  before update on public.attorney_notes
  for each row execute function public.touch_updated_at();

alter table public.attorney_notes enable row level security;

create policy "attorney_notes: author reads while shared" on public.attorney_notes
  for select to authenticated using (
    author_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id)
  );
create policy "attorney_notes: author adds while shared" on public.attorney_notes
  for insert to authenticated with check (
    author_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id)
  );
create policy "attorney_notes: author edits while shared" on public.attorney_notes
  for update to authenticated
  using (author_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id))
  with check (author_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id));
create policy "attorney_notes: author deletes" on public.attorney_notes
  for delete to authenticated using (author_id = (select auth.uid()));

-- Only the text can change after a note is written.
revoke insert, update on public.attorney_notes from authenticated;
grant insert (id, tracked_case_id, author_id, body) on public.attorney_notes to authenticated;
grant update (body) on public.attorney_notes to authenticated;

-- Signed-out visitors get nothing (new tables inherit Supabase's default grants).
revoke all on public.attorney_notes from anon;
revoke execute on function public.touch_updated_at() from public, anon;
