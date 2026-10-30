-- Descriptions shown in the Supabase Table Editor, so the schema reads on its own.
-- Terms follow GLOSSARY.md.

comment on table public.profiles is 'One row per account (client or attorney). Created by a trigger on sign-up.';
comment on column public.profiles.role is 'client tracks cases; attorney sees cases shared with their email.';
comment on column public.profiles.notify_on_change is 'Email the person when a tracked case changes status.';

comment on table public.consents is 'Opt-in to use the person''s cases in anonymous, aggregated insights. Revoking sets revoked_at; history is kept.';

comment on table public.cases is 'One row per receipt number, shared by everyone who tracks it. Holds the latest USCIS snapshot; never holds personal data.';
comment on column public.cases.status_category is 'Normalized category (received, approved, denied...) used for colors, explanations and insights.';
comment on column public.cases.check_state is 'awaiting_first_check until USCIS answers once; error when the last check failed.';
comment on column public.cases.last_error_code is 'Internal error code of the last failed check (invalid_receipt, not_found, unavailable, rate_limited, timeout...).';

comment on table public.status_events is 'Append-only status history of a case. Never updated or deleted.';
comment on column public.status_events.origin is 'reported: history USCIS sent back; observed: a change Kinstamp saw itself during a check.';
comment on column public.status_events.occurred_on is 'Date of the status, in US Eastern time.';

comment on table public.case_checks is 'Log of every call to the USCIS API: who triggered it, the result and how long it took. Feeds the daily budget and rate limits.';
comment on column public.case_checks.trigger is 'add (new case), refresh (person clicked refresh) or scheduled (daily cron).';

comment on table public.tracked_cases is 'A case saved by a client, with their own nickname. The unit that is shared with an attorney.';
comment on table public.shares is 'A tracked case shared with an attorney by email. Revoking sets revoked_at.';
comment on table public.key_dates is 'Dates the client or attorney adds to a tracked case (deadlines, appointments). Exportable to a calendar.';
comment on table public.notifications_sent is 'Status-change emails already sent, so nobody gets the same one twice.';
comment on table public.assistant_usage is 'One row per message to the case assistant, for the daily limit. Conversations are not stored.';
