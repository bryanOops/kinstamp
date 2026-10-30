-- Insights (ADR 0005): computed at query time, only from cases tracked by at least one
-- client with active consent, and only for groups of 5 cases or more. Returns
-- aggregates per form type; never receipt numbers, nicknames or people.

create function public.insights_by_form_type()
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
    select distinct c.id, c.form_type
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
        - (select min(e.occurred_on) from public.status_events e where e.case_id = cc.id and e.category = 'received')
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

revoke execute on function public.insights_by_form_type() from public, anon;
grant execute on function public.insights_by_form_type() to authenticated;
