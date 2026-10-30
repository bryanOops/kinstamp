-- Fixes from the pre-delivery review.

-- 1. Keep the record of every USCIS call even when its case is deleted (e.g. an unknown
--    receipt): the daily quota counts case_checks, so deleting them would hide real calls.
alter table public.case_checks alter column case_id drop not null;
alter table public.case_checks drop constraint case_checks_case_id_fkey;
alter table public.case_checks
  add constraint case_checks_case_id_fkey
  foreign key (case_id) references public.cases (id) on delete set null;

-- 2. Shares are matched by email, so only a confirmed email may claim them.
create or replace function public.current_attorney_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = (select auth.uid())
    and p.role = 'attorney'
    and u.email_confirmed_at is not null;
$$;

-- Which of these emails belong to a confirmed attorney account (to show a share as
-- active instead of pending). Server only: callers pass emails they already shared with.
create function public.confirmed_attorney_emails(candidate_emails text[])
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.email = any (candidate_emails)
    and p.role = 'attorney'
    and u.email_confirmed_at is not null;
$$;

revoke execute on function public.confirmed_attorney_emails(text[]) from public, anon, authenticated;
grant execute on function public.confirmed_attorney_emails(text[]) to service_role;

-- 3. Keep profiles.email in sync when the account email changes.
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();
