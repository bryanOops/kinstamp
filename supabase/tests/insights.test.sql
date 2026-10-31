-- Insights privacy rules (ADR 0005). Run with `npm run test:db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

-- Ignore any consent already in the database (e.g. demo data); the transaction rolls back.
update public.consents set revoked_at = now() where revoked_at is null;

-- Two clients: one consents, one does not.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'yes@example.com', '{"role":"client","insights_consent":"true"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'no@example.com', '{"role":"client"}');

-- I-130: 6 consented cases, received → approved in 100..150 days. I-485: 4 consented cases (too few).
-- I-765: 6 cases tracked only by the client without consent.
insert into public.cases (id, receipt_number, form_type)
select
  ('20000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'ZZY' || lpad(n::text, 10, '0'),
  case when n <= 6 then 'I-130' when n <= 10 then 'I-485' else 'I-765' end
from generate_series(1, 16) as n;

insert into public.status_events (case_id, origin, occurred_on, text_en, category)
select c.id, 'reported', date '2025-01-01', 'We received your form.', 'received' from public.cases c where c.receipt_number like 'ZZY%'
union all
select c.id, 'reported', date '2025-01-01' + (90 + 10 * (right(c.receipt_number, 2)::int)), 'We approved your form.', 'approved'
from public.cases c where c.receipt_number like 'ZZY%';

insert into public.tracked_cases (case_id, client_id)
select id, case when form_type = 'I-765' then '00000000-0000-0000-0000-0000000000a2'::uuid
                else '00000000-0000-0000-0000-0000000000a1'::uuid end
from public.cases where receipt_number like 'ZZY%';

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select is((select count(*)::int from public.insights_by_form_type()), 1, 'only groups with 5+ consented cases are returned');
select is((select form_type from public.insights_by_form_type()), 'I-130', 'the I-130 group is shown');
select is((select case_count from public.insights_by_form_type()), 6, 'counting each consented case once');
select is((select median_days from public.insights_by_form_type()), 125::numeric, 'with the median days from received to approved');

-- USCIS often reports only the approval in the history: the receipt date (submitted_at) stands in
-- for the missing "received" event. I-131: 5 consented cases approved 30 days after submission.
reset role;
insert into public.cases (id, receipt_number, form_type, submitted_at)
select ('30000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'ZZX' || lpad(n::text, 10, '0'), 'I-131', timestamptz '2025-03-01 14:00+00'
from generate_series(1, 5) as n;
insert into public.status_events (case_id, origin, occurred_on, text_en, category)
select c.id, 'reported', date '2025-03-31', 'We approved your form.', 'approved' from public.cases c where c.receipt_number like 'ZZX%';
insert into public.tracked_cases (case_id, client_id)
select id, '00000000-0000-0000-0000-0000000000a1'::uuid from public.cases where receipt_number like 'ZZX%';
set local role authenticated;
select is((select case_count from public.insights_by_form_type() where form_type = 'I-131'), 5, 'cases without a received event use the receipt date');
select is((select median_days from public.insights_by_form_type() where form_type = 'I-131'), 30::numeric, 'and measure from it to the approval');

-- Revoking consent removes those cases at once.
reset role;
update public.consents set revoked_at = now() where user_id = '00000000-0000-0000-0000-0000000000a1';
set local role authenticated;
select is((select count(*)::int from public.insights_by_form_type()), 0, 'revoking consent removes the cases immediately');

select * from finish();
rollback;
