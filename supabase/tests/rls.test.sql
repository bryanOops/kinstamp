-- Row-level security tests. Run with `npm run test:db` (Supabase local must be running).
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

-- Fixtures: two clients, one attorney, one other attorney, one case tracked by both clients.
insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'maria@example.com', '{"role":"client","full_name":"Maria","insights_consent":"true"}', now()),
  ('00000000-0000-0000-0000-00000000000b', 'jose@example.com', '{"role":"client","full_name":"Jose"}', now()),
  ('00000000-0000-0000-0000-00000000000c', 'Lawyer@Firm.com', '{"role":"attorney","full_name":"Ana Law"}', now()),
  ('00000000-0000-0000-0000-00000000000d', 'other@firm.com', '{"role":"attorney","full_name":"Other"}', now()),
  ('00000000-0000-0000-0000-00000000000e', 'impostor@firm.com', '{"role":"attorney","full_name":"Unconfirmed"}', null);

insert into public.cases (id, receipt_number, form_type, status_en, check_state) values
  ('10000000-0000-0000-0000-000000000001', 'ZZZ0000000001', 'I-130', 'Case Was Approved', 'ok'),
  ('10000000-0000-0000-0000-000000000002', 'ZZZ0000000002', 'I-130', 'Case Was Received', 'ok');

insert into public.status_events (case_id, origin, occurred_on, text_en, category)
values ('10000000-0000-0000-0000-000000000001', 'reported', '2023-09-05', 'We approved your Form I-130.', 'approved');

insert into public.tracked_cases (id, case_id, client_id, nickname) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Mom'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'Mamá');

-- The sign-up trigger created profiles and consent.
select is((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), 'attorney', 'trigger stores the role');
select is((select email from public.profiles where id = '00000000-0000-0000-0000-00000000000c'), 'lawyer@firm.com', 'trigger lowercases the email');
select is((select count(*)::int from public.consents where user_id = '00000000-0000-0000-0000-00000000000a'), 1, 'trigger records consent when given');

-- As Maria (client)
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.tracked_cases), 1, 'a client sees only their own tracked case');
select is((select nickname from public.tracked_cases), 'Mom', 'and not the other client''s nickname');
select is((select count(*)::int from public.cases), 1, 'a client reads the case they track');
select is((select count(*)::int from public.status_events), 1, 'and its status events');

insert into public.shares (tracked_case_id, attorney_email)
values ('20000000-0000-0000-0000-00000000000a', 'lawyer@firm.com');
select is((select count(*)::int from public.shares), 1, 'a client can share their tracked case');

select throws_ok(
  $$ insert into public.shares (tracked_case_id, attorney_email) values ('20000000-0000-0000-0000-00000000000b', 'lawyer@firm.com') $$,
  '42501', null, 'a client cannot share someone else''s tracked case'
);

select throws_ok(
  $$ update public.profiles set role = 'attorney' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'a client cannot change their role'
);

select throws_ok(
  $$ update public.cases set status_en = 'Case Was Denied' $$,
  '42501', null, 'a client cannot write to cases'
);

-- Guided tours are recorded on the profile; only that column (plus name, locale, notifications) is writable.
select lives_ok(
  $$ update public.profiles set tours_completed = '{cases}' where id = '00000000-0000-0000-0000-00000000000a' $$,
  'a person can record a finished guided tour on their own profile'
);
select is(
  (select tours_completed from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  '{cases}'::text[],
  'and reads it back'
);

-- The app adds a case with `insert ... returning id`: the select policy must see the new row in the same statement.
select lives_ok(
  $$ insert into public.tracked_cases (case_id, client_id, nickname) values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'Dad') returning id $$,
  'a client can add a tracked case and read back its id'
);

-- As the attorney the case was shared with
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select is((select count(*)::int from public.tracked_cases), 1, 'the attorney sees the shared tracked case only');
select is((select count(*)::int from public.cases), 1, 'and reads the case');

insert into public.key_dates (tracked_case_id, kind, date, title, created_by)
values ('20000000-0000-0000-0000-00000000000a', 'due_date', '2026-12-01', 'RFE response', '00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.key_dates), 1, 'the attorney can add a key date');
select is(
  (select client_name from public.attorney_shared_cases()),
  'Maria',
  'the attorney dashboard shows the client''s name for shared cases'
);

-- An attorney account whose email is not confirmed
reset role;
insert into public.shares (tracked_case_id, attorney_email)
values ('20000000-0000-0000-0000-00000000000a', 'impostor@firm.com');
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';
select is((select count(*)::int from public.cases), 0, 'an attorney with an unconfirmed email sees nothing');

-- As another attorney
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select is((select count(*)::int from public.cases), 0, 'an attorney without a share sees no cases');
select is((select count(*)::int from public.attorney_shared_cases()), 0, 'and an empty dashboard');

-- As Jose (other client tracking the same case)
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.key_dates), 0, 'key dates of another client''s tracked case stay private');
select is((select count(*)::int from public.attorney_shared_cases()), 0, 'a client gets nothing from the attorney dashboard');

-- Revoking ends the attorney's access immediately
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
update public.shares set revoked_at = now() where tracked_case_id = '20000000-0000-0000-0000-00000000000a';
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.cases), 0, 'after revoking, the attorney sees nothing');

select * from finish();
rollback;
