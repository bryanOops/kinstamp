-- USCIS histories often list the approval but not the receipt ("We received your Form…"); in the
-- sandbox only 3 of 25 approved cases have both. The case's receipt date (submitted_at, from
-- USCIS's submittedDate) is the same moment, so it stands in for a missing "received" event.
-- This is also how "Is my case slow?" measures a case's age. Same privacy rules as before.

create or replace function public.insights_by_form_type()
returns table (
  form_type text,
  case_count integer,
  median_days numeric,
  p25_days numeric,
  p75_days numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with consented_cases as (
    select distinct c.id, c.form_type, c.submitted_at
    from public.cases c
    join public.tracked_cases tc on tc.case_id = c.id
    join public.consents k on k.user_id = tc.client_id and k.kind = 'insights' and k.revoked_at is null
    where c.form_type is not null
  ),
  durations as (
    select
      cc.form_type,
      (
        (select min(e.occurred_on) from public.status_events e where e.case_id = cc.id and e.category = 'approved')
        - coalesce(
            (select min(e.occurred_on) from public.status_events e where e.case_id = cc.id and e.category = 'received'),
            (cc.submitted_at at time zone 'America/New_York')::date
          )
      ) as days
    from consented_cases cc
  )
  select
    d.form_type,
    count(*)::integer,
    round(percentile_cont(0.5) within group (order by d.days)::numeric, 0),
    round(percentile_cont(0.25) within group (order by d.days)::numeric, 0),
    round(percentile_cont(0.75) within group (order by d.days)::numeric, 0)
  from durations d
  where d.days is not null and d.days >= 0
  group by d.form_type
  having count(*) >= 5
  order by d.form_type;
$$;
