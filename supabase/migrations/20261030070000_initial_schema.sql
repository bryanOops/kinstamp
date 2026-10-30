-- Kinstamp initial schema. See docs/spec.md (section 5) and docs/adr/.
-- Every table has RLS enabled. Tables marked "server writes only" have no
-- insert/update/delete policies: only the service role writes to them.

-- ---------------------------------------------------------------------------
-- Profiles and consent
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null check (email = lower(email)),
  role text not null check (role in ('client', 'attorney')),
  locale text not null default 'en' check (locale in ('en', 'es')),
  notify_on_change boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('insights')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= granted_at)
);

-- At most one active consent of each kind per person.
create unique index consents_one_active
  on public.consents (user_id, kind)
  where revoked_at is null;

-- Creates the profile (and the consent, if given) from sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, full_name, email, role, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    lower(new.email),
    case when requested_role in ('client', 'attorney') then requested_role else 'client' end,
    case when requested_locale in ('en', 'es') then requested_locale else 'en' end
  );

  if (new.raw_user_meta_data ->> 'insights_consent') = 'true' then
    insert into public.consents (user_id, kind) values (new.id, 'insights');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Cases, status events and checks (server writes only)
-- ---------------------------------------------------------------------------

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique check (receipt_number ~ '^[A-Z]{3}[0-9]{10}$'),
  form_type text,
  submitted_at timestamptz,
  uscis_modified_at timestamptz,
  status_en text,
  status_es text,
  description_en text,
  description_es text,
  status_category text,
  check_state text not null default 'awaiting_first_check'
    check (check_state in ('awaiting_first_check', 'ok', 'error')),
  last_checked_at timestamptz,
  last_successful_check_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now()
);

create table public.status_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  origin text not null check (origin in ('reported', 'observed')),
  occurred_on date not null,
  observed_at timestamptz,
  text_en text not null,
  text_es text,
  description_en text,
  description_es text,
  category text not null,
  created_at timestamptz not null default now(),
  check ((origin = 'observed') = (observed_at is not null)),
  unique (case_id, origin, occurred_on, text_en)
);

create index status_events_case_timeline on public.status_events (case_id, occurred_on, created_at);

create table public.case_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  trigger text not null check (trigger in ('add', 'refresh', 'scheduled')),
  requested_by uuid references public.profiles (id) on delete set null,
  result text not null check (result in ('changed', 'unchanged', 'error')),
  error_code text,
  http_status integer,
  duration_ms integer not null,
  created_at timestamptz not null default now(),
  check ((result = 'error') = (error_code is not null))
);

create index case_checks_by_time on public.case_checks (created_at);
create index case_checks_by_person on public.case_checks (requested_by, created_at);
create index case_checks_by_case on public.case_checks (case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Tracked cases, shares and key dates
-- ---------------------------------------------------------------------------

create table public.tracked_cases (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  nickname text check (char_length(nickname) <= 80),
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (case_id, client_id)
);

create index tracked_cases_by_client on public.tracked_cases (client_id);

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  tracked_case_id uuid not null references public.tracked_cases (id) on delete cascade,
  attorney_email text not null check (attorney_email = lower(attorney_email)),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index shares_one_active
  on public.shares (tracked_case_id, attorney_email)
  where revoked_at is null;

create index shares_by_attorney on public.shares (attorney_email) where revoked_at is null;

create table public.key_dates (
  id uuid primary key default gen_random_uuid(),
  tracked_case_id uuid not null references public.tracked_cases (id) on delete cascade,
  kind text not null check (kind in ('due_date', 'appointment')),
  date date not null,
  time time,
  title text not null check (char_length(title) between 1 and 120),
  notes text check (char_length(notes) <= 1000),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index key_dates_by_tracked_case on public.key_dates (tracked_case_id, date);

-- ---------------------------------------------------------------------------
-- Bookkeeping (server writes only)
-- ---------------------------------------------------------------------------

create table public.notifications_sent (
  id uuid primary key default gen_random_uuid(),
  status_event_id uuid not null references public.status_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (status_event_id, user_id)
);

create table public.assistant_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index assistant_usage_by_person on public.assistant_usage (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so policies can call them without
-- recursing through each other's RLS.
-- ---------------------------------------------------------------------------

-- The signed-in person's email if they are an attorney, otherwise null.
create function public.current_attorney_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'attorney';
$$;

create function public.owns_tracked_case(target_tracked_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tracked_cases tc
    where tc.id = target_tracked_case_id and tc.client_id = (select auth.uid())
  );
$$;

create function public.is_shared_attorney(target_tracked_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shares s
    where s.tracked_case_id = target_tracked_case_id
      and s.revoked_at is null
      and s.attorney_email = public.current_attorney_email()
  );
$$;

create function public.can_access_tracked_case(target_tracked_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.owns_tracked_case(target_tracked_case_id)
      or public.is_shared_attorney(target_tracked_case_id);
$$;

create function public.can_read_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tracked_cases tc
    where tc.case_id = target_case_id and tc.client_id = (select auth.uid())
  ) or exists (
    select 1 from public.tracked_cases tc
    join public.shares s on s.tracked_case_id = tc.id
    where tc.case_id = target_case_id
      and s.revoked_at is null
      and s.attorney_email = public.current_attorney_email()
  );
$$;

revoke execute on function
  public.current_attorney_email(),
  public.owns_tracked_case(uuid),
  public.is_shared_attorney(uuid),
  public.can_access_tracked_case(uuid),
  public.can_read_case(uuid)
from public, anon;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.cases enable row level security;
alter table public.status_events enable row level security;
alter table public.case_checks enable row level security;
alter table public.tracked_cases enable row level security;
alter table public.shares enable row level security;
alter table public.key_dates enable row level security;
alter table public.notifications_sent enable row level security;
alter table public.assistant_usage enable row level security;

-- Signed-out visitors get nothing.
revoke all on all tables in schema public from anon;

-- profiles: read and edit your own row; role and email are not editable.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, locale, notify_on_change) on public.profiles to authenticated;

-- consents: read, grant and revoke your own.
create policy "consents: read own" on public.consents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "consents: grant own" on public.consents
  for insert to authenticated with check (user_id = (select auth.uid()) and revoked_at is null);
create policy "consents: revoke own" on public.consents
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update, delete on public.consents from authenticated;
grant update (revoked_at) on public.consents to authenticated;

-- cases, status_events, case_checks: readable by trackers and shared attorneys; server writes only.
create policy "cases: read if tracked or shared" on public.cases
  for select to authenticated using (public.can_read_case(id));
create policy "status_events: read if tracked or shared" on public.status_events
  for select to authenticated using (public.can_read_case(case_id));
create policy "case_checks: read if tracked or shared" on public.case_checks
  for select to authenticated using (public.can_read_case(case_id));
revoke insert, update, delete on public.cases, public.status_events, public.case_checks from authenticated;

-- tracked_cases: clients manage their own; shared attorneys can read them.
create policy "tracked_cases: read own or shared" on public.tracked_cases
  for select to authenticated using (public.can_access_tracked_case(id));
create policy "tracked_cases: clients add their own" on public.tracked_cases
  for insert to authenticated with check (
    client_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'client')
  );
create policy "tracked_cases: update own" on public.tracked_cases
  for update to authenticated using (client_id = (select auth.uid())) with check (client_id = (select auth.uid()));
create policy "tracked_cases: delete own" on public.tracked_cases
  for delete to authenticated using (client_id = (select auth.uid()));
revoke update on public.tracked_cases from authenticated;
grant update (nickname, last_viewed_at) on public.tracked_cases to authenticated;

-- shares: the owning client creates and revokes; the attorney sees shares addressed to them.
create policy "shares: read as owner or attorney" on public.shares
  for select to authenticated using (
    public.owns_tracked_case(tracked_case_id)
    or attorney_email = public.current_attorney_email()
  );
create policy "shares: owner creates" on public.shares
  for insert to authenticated with check (
    public.owns_tracked_case(tracked_case_id)
    and revoked_at is null
    and attorney_email <> (select p.email from public.profiles p where p.id = (select auth.uid()))
  );
create policy "shares: owner revokes" on public.shares
  for update to authenticated
  using (public.owns_tracked_case(tracked_case_id))
  with check (public.owns_tracked_case(tracked_case_id));
revoke update, delete on public.shares from authenticated;
grant update (revoked_at) on public.shares to authenticated;

-- key_dates: owner and shared attorneys read and add; the creator or the owner deletes.
create policy "key_dates: read if tracked or shared" on public.key_dates
  for select to authenticated using (public.can_access_tracked_case(tracked_case_id));
create policy "key_dates: add if tracked or shared" on public.key_dates
  for insert to authenticated with check (
    created_by = (select auth.uid()) and public.can_access_tracked_case(tracked_case_id)
  );
create policy "key_dates: delete as creator or owner" on public.key_dates
  for delete to authenticated using (
    created_by = (select auth.uid()) or public.owns_tracked_case(tracked_case_id)
  );
revoke update on public.key_dates from authenticated;

-- Bookkeeping: read your own rows; server writes only.
create policy "notifications_sent: read own" on public.notifications_sent
  for select to authenticated using (user_id = (select auth.uid()));
create policy "assistant_usage: read own" on public.assistant_usage
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications_sent, public.assistant_usage from authenticated;
