-- Guided tours are completed once per account, not per browser, so the record lives on the profile.
alter table public.profiles
  add column tours_completed text[] not null default '{}';

comment on column public.profiles.tours_completed is 'Which guided tours the person has finished: cases, attorney, case_detail.';

-- Same pattern as the initial schema: people may edit this column of their own row (RLS limits the row).
grant update (tours_completed) on public.profiles to authenticated;
