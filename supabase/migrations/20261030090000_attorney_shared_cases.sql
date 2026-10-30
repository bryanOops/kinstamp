-- The attorney dashboard: every case actively shared with the signed-in attorney,
-- with the client's name. SECURITY DEFINER so it can read the client's name without
-- granting attorneys access to client profiles; it only returns rows for shares
-- addressed to the caller's own email.
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
  shared_at timestamptz
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
    s.created_at
  from public.shares s
  join public.tracked_cases tc on tc.id = s.tracked_case_id
  join public.cases c on c.id = tc.case_id
  join public.profiles p on p.id = tc.client_id
  where s.revoked_at is null
    and s.attorney_email = public.current_attorney_email();
$$;

revoke execute on function public.attorney_shared_cases() from public, anon;
grant execute on function public.attorney_shared_cases() to authenticated;
