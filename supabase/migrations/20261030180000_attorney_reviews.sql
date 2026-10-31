-- "Mark as reviewed" on the attorney dashboard (docs/spec.md, section 5).
-- A shared case needs review when a status event was recorded after the attorney's reviewed_at
-- (or, if they never reviewed it, after the share was created). The decision itself is computed
-- in src/lib/attorney/review.ts; the database only stores when each attorney last reviewed a case.

create table public.attorney_reviews (
  attorney_id uuid not null references public.profiles (id) on delete cascade,
  tracked_case_id uuid not null references public.tracked_cases (id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  primary key (attorney_id, tracked_case_id)
);

comment on table public.attorney_reviews is 'When an attorney last marked a shared case as reviewed. Private to that attorney; feeds the "Needs review" filter on the dashboard.';

alter table public.attorney_reviews enable row level security;

create policy "attorney_reviews: read own" on public.attorney_reviews
  for select to authenticated using (attorney_id = (select auth.uid()));
create policy "attorney_reviews: add own while shared" on public.attorney_reviews
  for insert to authenticated with check (
    attorney_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id)
  );
create policy "attorney_reviews: update own while shared" on public.attorney_reviews
  for update to authenticated
  using (attorney_id = (select auth.uid()))
  with check (attorney_id = (select auth.uid()) and public.is_shared_attorney(tracked_case_id));

revoke all on public.attorney_reviews from anon;
revoke update, delete on public.attorney_reviews from authenticated;
grant update (reviewed_at) on public.attorney_reviews to authenticated;

-- Marks a shared case as reviewed now, by the database clock (the same clock that stamps status
-- events). SECURITY INVOKER: the policies above decide whether the caller may do it.
create function public.mark_case_reviewed(target_tracked_case_id uuid)
returns timestamptz
language sql
volatile
security invoker
set search_path = ''
as $$
  insert into public.attorney_reviews (attorney_id, tracked_case_id)
  values ((select auth.uid()), target_tracked_case_id)
  on conflict (attorney_id, tracked_case_id) do update set reviewed_at = now()
  returning reviewed_at;
$$;

revoke execute on function public.mark_case_reviewed(uuid) from public, anon;
grant execute on function public.mark_case_reviewed(uuid) to authenticated;

-- The dashboard also returns when the newest status event was recorded and when the attorney last
-- reviewed the case. Adding output columns changes the return type, which `create or replace`
-- cannot do, so the function is dropped and created again with the same rules.
drop function public.attorney_shared_cases();

create function public.attorney_shared_cases()
returns table (
  share_id uuid,
  tracked_case_id uuid,
  case_id uuid,
  client_name text,
  nickname text,
  receipt_number text,
  form_type text,
  status_en text,
  status_es text,
  status_category text,
  check_state text,
  last_successful_check_at timestamptz,
  last_change_on date,
  next_key_date date,
  shared_at timestamptz,
  last_event_at timestamptz,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    tc.id,
    c.id,
    p.full_name,
    tc.nickname,
    c.receipt_number,
    c.form_type,
    c.status_en,
    c.status_es,
    c.status_category,
    c.check_state,
    c.last_successful_check_at,
    (select max(e.occurred_on) from public.status_events e where e.case_id = c.id),
    (select min(k.date) from public.key_dates k where k.tracked_case_id = tc.id and k.date >= current_date),
    s.created_at,
    (select max(e.created_at) from public.status_events e where e.case_id = c.id),
    (select r.reviewed_at from public.attorney_reviews r where r.tracked_case_id = tc.id and r.attorney_id = (select auth.uid()))
  from public.shares s
  join public.tracked_cases tc on tc.id = s.tracked_case_id
  join public.cases c on c.id = tc.case_id
  join public.profiles p on p.id = tc.client_id
  where s.revoked_at is null
    and s.attorney_email = public.current_attorney_email();
$$;

revoke execute on function public.attorney_shared_cases() from public, anon;
grant execute on function public.attorney_shared_cases() to authenticated;
