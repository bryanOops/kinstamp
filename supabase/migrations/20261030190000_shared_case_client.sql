-- The client behind a shared case, for the header of the attorney case detail: name, email and
-- since when the case is shared. The client chose to share the case with this attorney, so their
-- email is shown to them. SECURITY DEFINER so attorneys never get read access to profiles: it
-- returns a row only for an active share addressed to the caller's own confirmed email.
create function public.shared_case_client(target_tracked_case_id uuid)
returns table (
  client_name text,
  client_email text,
  shared_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, p.email, s.created_at
  from public.shares s
  join public.tracked_cases tc on tc.id = s.tracked_case_id
  join public.profiles p on p.id = tc.client_id
  where s.tracked_case_id = target_tracked_case_id
    and s.revoked_at is null
    and s.attorney_email = public.current_attorney_email();
$$;

revoke execute on function public.shared_case_client(uuid) from public, anon;
grant execute on function public.shared_case_client(uuid) to authenticated;
