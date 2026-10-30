-- tours_completed is writable by the person; only known tour ids may be stored.
alter table public.profiles
  add constraint profiles_tours_completed_known
  check (tours_completed <@ array['cases', 'attorney', 'case_detail']::text[]);
