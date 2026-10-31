-- Attorney tools: private notes, "mark as reviewed" and the client contact on a shared case.
-- Run with `npm run test:db` (Supabase local must be running).
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

-- Fixtures: two clients, the attorney Maria shared with, another attorney; one case per client.
insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'maria@example.com', '{"role":"client","full_name":"Maria Lopez"}', now()),
  ('00000000-0000-0000-0000-00000000000b', 'jose@example.com', '{"role":"client","full_name":"Jose"}', now()),
  ('00000000-0000-0000-0000-00000000000c', 'lawyer@firm.com', '{"role":"attorney","full_name":"Ana Law"}', now()),
  ('00000000-0000-0000-0000-00000000000d', 'other@firm.com', '{"role":"attorney","full_name":"Other"}', now());

insert into public.cases (id, receipt_number, form_type, status_en, check_state) values
  ('10000000-0000-0000-0000-000000000001', 'ZZZ0000000001', 'I-130', 'Case Was Received', 'ok'),
  ('10000000-0000-0000-0000-000000000002', 'ZZZ0000000002', 'I-485', 'Case Was Received', 'ok');

insert into public.tracked_cases (id, case_id, client_id, nickname) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Mom'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'Me');

insert into public.shares (id, tracked_case_id, attorney_email, created_at) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'lawyer@firm.com', now() - interval '2 days');

-- One status event recorded yesterday, after the share.
insert into public.status_events (case_id, origin, occurred_on, observed_at, text_en, category, created_at)
values ('10000000-0000-0000-0000-000000000001', 'observed', current_date - 1, now() - interval '1 day', 'Case Was Received', 'received', now() - interval '1 day');

-- ---------------------------------------------------------------------------
-- As the attorney the case was shared with
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select lives_ok(
  $$ insert into public.attorney_notes (id, tracked_case_id, author_id, body)
     values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'Ask for the marriage certificate') $$,
  'the shared attorney can add a note to the case'
);
select is((select count(*)::int from public.attorney_notes), 1, 'and reads it back');

-- now() is fixed inside a transaction: age the note so the edit can be seen moving updated_at.
reset role;
update public.attorney_notes set created_at = now() - interval '1 hour', updated_at = now() - interval '1 hour';
set local role authenticated;

update public.attorney_notes set body = 'Ask for the marriage certificate and the I-864' where id = '40000000-0000-0000-0000-000000000001';
select is(
  (select body from public.attorney_notes where id = '40000000-0000-0000-0000-000000000001'),
  'Ask for the marriage certificate and the I-864',
  'the author can edit their note'
);
select ok(
  (select updated_at > created_at from public.attorney_notes where id = '40000000-0000-0000-0000-000000000001'),
  'editing a note moves updated_at'
);
select throws_ok(
  $$ update public.attorney_notes set author_id = '00000000-0000-0000-0000-00000000000d' $$,
  '42501', null, 'the author of a note cannot be changed'
);
select throws_ok(
  $$ insert into public.attorney_notes (tracked_case_id, author_id, body)
     values ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000d', 'Signed as someone else') $$,
  '42501', null, 'an attorney cannot write a note in someone else''s name'
);
select throws_ok(
  $$ insert into public.attorney_notes (tracked_case_id, author_id, body)
     values ('20000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c', 'Not my case') $$,
  '42501', null, 'an attorney cannot add a note to a case not shared with them'
);
select throws_ok(
  $$ insert into public.attorney_notes (tracked_case_id, author_id, body)
     values ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', '') $$,
  '23514', null, 'a note cannot be empty'
);
select throws_ok(
  format(
    $$ insert into public.attorney_notes (tracked_case_id, author_id, body) values ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', %L) $$,
    repeat('a', 2001)
  ),
  '23514', null, 'a note is at most 2000 characters'
);

-- Mark as reviewed
select ok(
  (select public.mark_case_reviewed('20000000-0000-0000-0000-00000000000a') is not null),
  'the shared attorney can mark the case as reviewed'
);
select ok(
  (select reviewed_at is not null and last_event_at is not null from public.attorney_shared_cases()),
  'the dashboard returns when the case was reviewed and when its newest status event was recorded'
);
select lives_ok(
  $$ select public.mark_case_reviewed('20000000-0000-0000-0000-00000000000a') $$,
  'marking it again only moves reviewed_at'
);
select is((select count(*)::int from public.attorney_reviews), 1, 'one review row per attorney and tracked case');
select throws_ok(
  $$ select public.mark_case_reviewed('20000000-0000-0000-0000-00000000000b') $$,
  '42501', null, 'an attorney cannot mark a case not shared with them'
);
select throws_ok(
  $$ insert into public.attorney_reviews (attorney_id, tracked_case_id) values ('00000000-0000-0000-0000-00000000000d', '20000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'an attorney cannot record a review for someone else'
);

-- Client contact
select results_eq(
  $$ select client_name, client_email from public.shared_case_client('20000000-0000-0000-0000-00000000000a') $$,
  $$ values ('Maria Lopez'::text, 'maria@example.com'::text) $$,
  'the shared attorney gets the client''s name and email'
);
select is(
  (select count(*)::int from public.shared_case_client('20000000-0000-0000-0000-00000000000b')),
  0,
  'but not the contact of a client who did not share with them'
);

-- ---------------------------------------------------------------------------
-- As the client who shared the case
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.attorney_notes), 0, 'the client never sees the attorney''s notes on their case');
select is((select count(*)::int from public.attorney_reviews), 0, 'nor the attorney''s reviews');
select throws_ok(
  $$ insert into public.attorney_notes (tracked_case_id, author_id, body)
     values ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'Client note') $$,
  '42501', null, 'a client cannot write attorney notes, even on their own case'
);

-- ---------------------------------------------------------------------------
-- As another attorney
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select is((select count(*)::int from public.attorney_notes), 0, 'another attorney sees no notes');
select is((select count(*)::int from public.attorney_reviews), 0, 'and no reviews');
select is(
  (select count(*)::int from public.shared_case_client('20000000-0000-0000-0000-00000000000a')),
  0,
  'and cannot get the contact of a client who did not share with them'
);
delete from public.attorney_notes;
update public.attorney_notes set body = 'Overwritten';

-- ---------------------------------------------------------------------------
-- Back as the author: the other attorney changed nothing; delete works
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is(
  (select body from public.attorney_notes where id = '40000000-0000-0000-0000-000000000001'),
  'Ask for the marriage certificate and the I-864',
  'another attorney can neither edit nor delete the note'
);
insert into public.attorney_notes (id, tracked_case_id, author_id, body)
values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'Temporary');
delete from public.attorney_notes where id = '40000000-0000-0000-0000-000000000002';
select is((select count(*)::int from public.attorney_notes), 1, 'the author can delete their note');

-- ---------------------------------------------------------------------------
-- Revoking hides everything
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
update public.shares set revoked_at = now() where id = '30000000-0000-0000-0000-000000000001';

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.attorney_notes), 0, 'after revoking, the author no longer sees their notes');
select throws_ok(
  $$ insert into public.attorney_notes (tracked_case_id, author_id, body)
     values ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'Too late') $$,
  '42501', null, 'and cannot add new ones'
);
update public.attorney_notes set body = 'Edited after revoke';
select throws_ok(
  $$ select public.mark_case_reviewed('20000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'nor mark the case as reviewed'
);
select is(
  (select count(*)::int from public.shared_case_client('20000000-0000-0000-0000-00000000000a')),
  0,
  'nor get the client''s contact'
);

reset role;
select is(
  (select body from public.attorney_notes where id = '40000000-0000-0000-0000-000000000001'),
  'Ask for the marriage certificate and the I-864',
  'the hidden note is kept unchanged (it reappears if the client shares again)'
);
select is(
  (select obj_description('public.attorney_notes'::regclass, 'pg_class')) is not null,
  true,
  'attorney_notes has a table comment'
);

select * from finish();
rollback;
