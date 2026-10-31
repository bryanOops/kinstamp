# Kinstamp — Product and technical spec

Kinstamp lets families track their USCIS cases over time and share them with their attorney. This spec turns the exercise brief and the decisions in `docs/adr/` into what we build. Terms follow `GLOSSARY.md`.

Status: draft, 2026-10-30. Items marked **[fixtures]** are confirmed once real sandbox responses are recorded.

---

## 1. Users

| User | Goal | Main screens |
|---|---|---|
| **Client** | Know where their family's cases stand without checking USCIS every day, and keep their attorney in the loop | Cases, case detail, insights, settings |
| **Attorney** | See every case their clients shared, spot what changed and what is urgent | Attorney dashboard, case detail (shared view) |

The role is chosen at sign-up and cannot be changed later.

## 2. Requirements and acceptance criteria

The six core requirements come from the brief. Sharing with an attorney is not in that list, but the brief tests it ("share it with an attorney") and lists it under security.

| # | Requirement | Done when |
|---|---|---|
| R1 | Case lookup | A client enters a receipt number and sees form type, status (EN/ES), description and timeline. |
| R2 | Accounts | Sign up, confirm email, sign in, sign out. A client never sees another client's tracked cases, key dates or consent (verified with two accounts). |
| R3 | Tracked cases | After signing out and back in, every tracked case is still listed with its nickname. |
| R4 | Refresh | One click runs a check (or reuses one under 60 s old) and the screen shows the result: "No changes since …", "Status changed", or why USCIS could not be reached. |
| R5 | Status history | The timeline lists every status event with its date and origin (reported by USCIS / observed by Kinstamp). |
| R6 | Data for insights | Status events are append-only, categorized and dated; consent is recorded; insights are computed only from consented cases and hide groups under 5 cases. |
| R7 | Share with attorney | A client shares a tracked case with an email; the attorney sees it (and only it) after signing in with that email; the client can revoke it and access ends immediately. |

Extras, in build order (cut from the bottom if time runs out):

| # | Extra | Done when |
|---|---|---|
| E1 | Timeline + plain-English explanations | Each status category shows what it means and what usually comes next, in EN and ES. |
| E2 | Attorney dashboard | Table of shared cases with client, status, last change, next key date; filter "changed in the last 7 days". |
| E3 | "Is my case slow?" | Compares the case age with the official processing time for its form type, shows the source and date, and links to the USCIS e-Request page when the case is outside it. |
| E4 | Key dates | Client or attorney adds a due date or appointment; countdown on the case, `.ics` download, attorney dashboard sorted by urgency. |
| E5 | Insights | Per form type: count, median and 25–75% range of days from received to approved, from consented cases only. |
| E6 | Scheduled checks + email | Weekdays during sandbox hours, every case is checked once; clients with notifications on get an email when a status event is observed. |
| E7 | Case assistant | "Ask about this case": an agent answers using tools over the case's own data, says when it does not know, and adds a not-legal-advice note. |
| E8 | If time allows | "Who viewed my case" (attorney views and refreshes shown to the client); "Add from your notice" (paste notice text, detect receipt numbers). |

## 3. Screens and routes

| Route | Who | Content |
|---|---|---|
| `/` | Public | Landing: value proposition, sign in / create account. |
| `/sign-up` | Public | Name, email, password, role, unchecked consent checkbox. |
| `/sign-in` | Public | Email, password; note pointing reviewers to the demo accounts. |
| `/auth/confirm` | Public | Email confirmation callback. |
| `/cases` | Client | Tracked cases with status, last change and a "changed since your last visit" marker; "Add a case" dialog with sandbox sample receipts. |
| `/cases/[trackedCaseId]` | Client | Case detail: header (nickname, receipt, form), current status (EN/ES), refresh, plain-English card, "Is my case slow?", key dates, shares, mini insight, timeline, assistant. |
| `/attorney` | Attorney | Shared cases table, filters, urgency order. "All (N) / Needs review (N)" view: a case needs review when a status event was recorded after the attorney last marked it as reviewed (4.8); those rows carry a vermilion dot plus "New update", come first in the default order and have a "Mark as reviewed" action. |
| `/attorney/cases/[trackedCaseId]` | Attorney | Same case detail without edit, share or delete actions; can refresh and add key dates. Above the status: the client's name and email, "Shared with you since {date}" and "Write to client" (`mailto:` with the subject "About {nickname or receipt}"). Header: "Mark as reviewed" while the case needs review, "Reviewed" otherwise. Aside, after key dates: "My notes", the attorney's private notes (4.8). RLS returns the tracked case only while a share to the attorney is active. |
| `/insights` | Client | Insights by form type, highlighting the client's own case if they have one. |
| `/settings` | Both | Profile, language, consent, email notifications, delete account. |
| `/api/cron/scheduled-checks` | Vercel Cron | Runs scheduled checks. Protected by `CRON_SECRET`. |
| `/api/assistant` | Signed in | Streams assistant replies. |

Every route has loading, empty and error states. A banner appears on case screens when the last check failed because USCIS was unavailable: "USCIS is offline (Mon–Fri, 7am–8pm ET). Showing the last saved status from {time}."

The language switch (EN/ES) is always in the top bar, next to a Help button that replays the page's guided tour.

**Guided tours.** The first time an account opens `/cases` (clients), `/attorney` (attorneys) or a case detail (both roles), a short spotlight tour (4–6 steps anchored to real elements) explains the screen: the "public board vs. private notebook" analogy, how to add a case, what a card shows, insights and settings; for attorneys, what is shared, the "Needs review" view, and the table's urgency order and filters; on a case, who shared it (attorneys only), the status in plain language, the timeline and its origins, key dates, private notes (attorneys only), sharing (clients only) and the assistant. Finishing or skipping records the tour in `profiles.tours_completed`, so it does not start again on another device; Help replays it at any time.

**Session timeout.** After 30 minutes without activity a "Still there?" dialog counts down 60 seconds; staying resets the clock, otherwise the person is signed out and lands on `/sign-in?reason=idle` with a notice. The countdown starts when the inactivity is noticed, so a device that slept through the limit shows the dialog on wake instead of signing out silently. A request to a private page with a session cookie that no longer validates is redirected by the proxy to `/sign-in?reason=expired&next=<path>` ("Your session ended. Sign in to continue where you left off."); `requireProfile` does the same as a fallback.

## 4. Flows

### 4.1 Sign up
1. The person fills in the form. Role and consent travel as user metadata.
2. Supabase sends a confirmation email through Resend.
3. On first sign-in a database trigger has already created the profile (role, locale) and, if checked, a consent row.
4. Clients land on `/cases`; attorneys on `/attorney`.

Email confirmation is a security requirement, not just polish: shares are matched by email (4.4), so an unconfirmed account must never be able to claim an attorney's email.

### 4.2 Add a case (client)
1. Receipt number is normalized (trim, remove spaces and dashes, uppercase) and validated: `^[A-Z]{3}[0-9]{10}$`.
2. If the client already tracks it: open that case.
3. If the case already exists (another person tracks it, or it was pre-checked): create the tracked case and show its saved data at once. If its last successful check is older than one hour, run a check; if USCIS is unavailable, keep the saved data and show the offline banner.
4. If the case does not exist yet, run a check:
   - **Success:** create the case, its reported events and an initial observed event for the current status, then the tracked case.
   - **Not found:** show the error, create nothing. **[fixtures]** (exact status code to confirm)
   - **USCIS unavailable or quota reached:** create the case as *awaiting first check* plus the tracked case, and tell the client it will be checked automatically when USCIS is back. The client keeps a working list even on weekends.
   - **Other errors** (authentication, unreadable response, unknown): show the error, create nothing.
   - Adding counts toward the same per-person limit as refreshing (30 checks per hour), and every call to USCIS stays in `case_checks` even when its case is removed, so the daily budget cannot be bypassed.

### 4.3 Refresh (client or attorney)
1. Access check through RLS (tracked case or active share).
2. If the case was checked successfully less than 60 s ago, return that result immediately ("Checked 20 seconds ago").
3. Per-person limit: 30 checks per hour (adds and refreshes). Global guard: once 900 checks have run today (Eastern day), stop calling USCIS and return the saved status with a notice.
4. Run the check (section 6). Record it in `case_checks`.
5. Return the result to the screen: changed (new event highlighted on the timeline), unchanged, or error with the last saved status.

### 4.4 Share with an attorney
1. The client enters the attorney's email on a tracked case. It is normalized to lowercase.
2. A share row is created. The client sees it as *pending* until an attorney account with that confirmed email exists, then *active*.
3. The attorney sees the case as soon as they sign in with that email; no linking step is needed.
   - Kinstamp emails the attorney right after sharing. Without a confirmed attorney account, the email is an invitation: its link opens sign-up with the email and the attorney role prefilled (`/sign-up?invite=<share id>`; the link carries no personal data). With an account, it links to *Clients' cases*. The client sees the same result in both cases.
4. Revoking sets `revoked_at`; RLS stops returning the case immediately.
5. Sharing with your own email or with a client account is rejected with a clear message.

### 4.5 Key dates
1. On a case, the client (or an attorney with an active share) adds a key date: kind (due date / appointment), date, optional time, title, optional notes.
2. The case shows a countdown for the next key date; the attorney dashboard sorts by it.
3. "Add to calendar" downloads an `.ics` file generated on the server.
4. The creator or the client can delete a key date.

### 4.6 Scheduled checks
1. Vercel Cron calls `/api/cron/scheduled-checks` on weekdays at 14:00 and 15:00 UTC, so one run always lands at 10:00 Eastern with or without daylight saving time; the second run skips cases checked in the last 6 hours, so it costs nothing extra.
2. Every case that has at least one tracked case is checked sequentially, 250 ms apart (under 5 per second), skipping cases checked in the last 6 hours, and stopping at the global guard.
3. For each observed status event, every tracking client with notifications on receives one email in their language. `notifications_sent` prevents duplicates.

### 4.7 Delete account
Deleting an account removes the profile, tracked cases, shares they created or received, key dates they created, attorney notes and reviews they wrote, and consent rows. A case nobody tracks anymore is deleted with its status events and checks.

### 4.8 Attorney tools on a shared case
1. **Private notes.** On the shared case detail the attorney writes notes for themselves (1–2,000 characters; Ctrl/⌘+Enter saves). The list is newest first with relative time; each note can be edited inline or deleted after confirmation. Only the author sees them, and only while the share is active: the client never does, and revoking hides them (they reappear if the client shares the case with the same attorney again). Deleting the tracked case deletes them.
2. **Mark as reviewed.** A shared case *needs review* when its newest status event (any origin, by the time Kinstamp recorded it, `status_events.created_at`) is later than the attorney's `reviewed_at`, or, if they never reviewed it, later than the share's `created_at`. The rule is pure and tested in `src/lib/attorney/review.ts`. "Mark as reviewed" (dashboard row or case header) stores `reviewed_at = now()` by the database clock through `mark_case_reviewed()`. Opening a case never marks it. Reviews are per attorney and survive a revoke and re-share; a re-share starts from the new share's `created_at` only when the attorney never reviewed the case.
3. **Client contact.** The attorney sees the name and email of the client who shared the case with them, through `shared_case_client(tracked_case_id)`. The client chose to share the case with that attorney, so this is expected; it never widens `profiles` RLS.

## 5. Data model

All tables live in `public`, have RLS enabled and are created by migrations in `supabase/migrations/`. Writes marked *server* are done only with the service role.

### Tables

**`profiles`**: one per auth user.
`id uuid pk → auth.users`, `full_name text`, `email text` (lowercase copy, used for share matching), `role text check in ('client','attorney')`, `locale text check in ('en','es') default 'en'`, `notify_on_change bool default true`, `created_at timestamptz`.

**`consents`**: append-only consent history.
`id uuid pk`, `user_id uuid → profiles`, `kind text check in ('insights')`, `granted_at timestamptz`, `revoked_at timestamptz null`.
Current consent = a row with `revoked_at is null`. Revoking sets `revoked_at`; granting again adds a row.

**`cases`**: one per receipt number (ADR 0001). *Server* writes only.
`id uuid pk`, `receipt_number text unique check (~ '^[A-Z]{3}[0-9]{10}$')`, `form_type text null`, `submitted_at timestamptz null`, `uscis_modified_at timestamptz null`, `status_en text null`, `status_es text null`, `description_en text null`, `description_es text null`, `status_category text null`, `check_state text check in ('awaiting_first_check','ok','error')`, `last_checked_at timestamptz null`, `last_successful_check_at timestamptz null`, `last_error_code text null`, `created_at timestamptz`.

**`status_events`**: append-only (ADR 0002). *Server* writes only; no update or delete policies.
`id uuid pk`, `case_id uuid → cases on delete cascade`, `origin text check in ('reported','observed')`, `occurred_on date`, `observed_at timestamptz null` (observed only), `text_en text`, `text_es text null`, `description_en text null`, `description_es text null`, `category text`, `created_at timestamptz`.
Unique: `(case_id, origin, occurred_on, text_en)`.

`category` is one of `received`, `biometrics`, `interview`, `evidence_requested`, `evidence_received`, `approved`, `card_produced`, `card_delivered`, `transferred`, `denied`, `withdrawn`, `other`. It is assigned in code from the English text by an ordered list of patterns, unit-tested against the fixtures. **[fixtures]**

**`case_checks`**: every check, for audit, quota and rate limits. *Server* writes only.
`id uuid pk`, `case_id uuid → cases on delete cascade`, `trigger text check in ('add','refresh','scheduled')`, `requested_by uuid null → profiles on delete set null`, `result text check in ('changed','unchanged','error')`, `error_code text null`, `http_status int null`, `duration_ms int`, `created_at timestamptz`.

**`tracked_cases`**: a client's link to a case.
`id uuid pk`, `case_id uuid → cases`, `client_id uuid → profiles on delete cascade`, `nickname text null`, `last_viewed_at timestamptz null`, `created_at timestamptz`. Unique `(case_id, client_id)`.

**`shares`**
`id uuid pk`, `tracked_case_id uuid → tracked_cases on delete cascade`, `attorney_email text` (lowercase), `created_at timestamptz`, `revoked_at timestamptz null`.
Unique active share: `(tracked_case_id, attorney_email) where revoked_at is null`.

**`key_dates`**
`id uuid pk`, `tracked_case_id uuid → tracked_cases on delete cascade`, `kind text check in ('due_date','appointment')`, `date date`, `time time null`, `title text`, `notes text null`, `created_by uuid → profiles on delete cascade`, `created_at timestamptz`.

**`attorney_notes`**: an attorney's private notes on a tracked case shared with them.
`id uuid pk`, `tracked_case_id uuid → tracked_cases on delete cascade`, `author_id uuid → profiles on delete cascade`, `body text check (char_length between 1 and 2000)`, `created_at timestamptz`, `updated_at timestamptz` (set by a trigger on update). Only `body` is updatable.

**`attorney_reviews`**: when an attorney last marked a shared case as reviewed.
`attorney_id uuid → profiles on delete cascade`, `tracked_case_id uuid → tracked_cases on delete cascade`, `reviewed_at timestamptz default now()`. Primary key `(attorney_id, tracked_case_id)`. Written through `mark_case_reviewed(tracked_case_id)` (`security invoker`, so the policies apply).

**`notifications_sent`**
`id uuid pk`, `status_event_id uuid → status_events on delete cascade`, `user_id uuid → profiles on delete cascade`, `sent_at timestamptz`. Unique `(status_event_id, user_id)`.

**`assistant_usage`**: rate limiting only; conversations are not stored.
`id uuid pk`, `user_id uuid → profiles on delete cascade`, `created_at timestamptz`.

### Row-level security

Helper functions (`security definer`, `stable`):
- `is_tracker(case_id)`: the current user tracks the case.
- `is_shared_attorney(tracked_case_id)`: the current user is an attorney, their confirmed email matches an active share of that tracked case.
- `can_read_case(case_id)`: tracker, or attorney with an active share on any tracked case of that case.

| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `profiles` | own row | trigger only | own row, except `role` and `email` | via account deletion |
| `consents` | own rows | own rows | own rows (set `revoked_at`) | — |
| `cases` | `can_read_case` | server | server | server |
| `status_events` | `can_read_case` | server | — | — |
| `case_checks` | `can_read_case` | server | — | — |
| `tracked_cases` | own rows; shared attorney | own rows (client role) | own nickname / last viewed | own rows |
| `shares` | client who owns the tracked case; attorney whose email matches | client who owns the tracked case | owner sets `revoked_at` | — |
| `key_dates` | tracker of the tracked case; shared attorney | same as select | — | creator, or the client who owns the tracked case |
| `attorney_notes` | author, while `is_shared_attorney` | author, while `is_shared_attorney` | author, while `is_shared_attorney` (`body` only) | author |
| `attorney_reviews` | own rows | own rows, while `is_shared_attorney` | own rows, while `is_shared_attorney` (`reviewed_at` only) | — |
| `notifications_sent`, `assistant_usage` | own rows | server | — | — |

The attorney view shows the client's name, and on the case detail their email, without any access to `profiles`: two `security definer` functions return them only for active shares addressed to the caller's confirmed email. `attorney_shared_cases()` feeds the dashboard (client name, case, next key date, `last_event_at`, `reviewed_at`); `shared_case_client(tracked_case_id)` returns `client_name`, `client_email` and `shared_at` for one case. Both are covered by pgTAP tests in `supabase/tests/`, including another attorney and the client getting nothing.

### Insights

A `security definer` SQL function `insights_by_form_type(form_type)` returns `count`, `median_days`, `p25_days`, `p75_days` for "days from the first `received` event (or, when USCIS did not report one, the receipt date `submitted_at` in Eastern time) to the first `approved` event", computed over cases tracked by at least one client with active consent. It returns no row when `count < 5`. It never returns receipt numbers or identities (ADR 0005).

### Official processing times

A dated JSON file in the repo (`src/data/official-processing-times.json`): form type, the published range, the USCIS source URL and the date it was read. Shown with its source and date.

## 6. USCIS integration

Module `src/lib/uscis/`, server-only.

- **Token:** cached in memory until 60 s before expiry; renewed on a `401` once.
- **Request:** `GET /case-status/{receipt}` with an 8 s timeout. One retry with backoff on network errors, timeouts and 5xx, except the out-of-hours 503, which is not retried.
- **Parsing:** Zod schema for the success body; `submittedDate`, `modifiedDate` and `hist_case_status` are optional (IOE receipts, cases without history). Dates are parsed from `MM-DD-YYYY HH:mm:ss` (assumed Eastern) and `YYYY-MM-DD`.
- **Errors** map to: `invalid_receipt`, `not_found`, `unavailable`, `rate_limited`, `quota_exhausted`, `timeout`, `auth_failed`, `unexpected_response` (a 200 whose body cannot be read), `unknown`. The parser accepts the three error shapes in `docs/uscis-api.md`. Every code has an EN/ES message.
- **Mock provider:** when `USCIS_CLIENT_ID` is missing, the client reads responses from `src/lib/uscis/__fixtures__/` (real recorded responses). Never used when credentials are set (ADR 0003).

Module `src/lib/cases/` (pure, test-first):
- `detectChange(latestEvent, response)`: compares normalized English status titles (trim, collapse spaces, case-insensitive).
- `mergeReportedHistory(existing, hist)`: returns only new reported events.
- `categorize(text)`: status category.
- `caseAge`, `compareWithOfficialTime`: inputs for "Is my case slow?".

## 7. Case assistant (E7)

- Route Handler that runs a tool-use loop with the Claude API (model chosen when implementing, using the `claude-api` skill) and streams the answer.
- Tools are server functions that query Supabase **as the signed-in user**, so RLS applies: `get_case_overview`, `get_timeline`, `get_key_dates`, `get_official_processing_time`, `get_insights`. General explanations of a status come from the model itself, grounded in the status and description USCIS returned.
- System prompt: answer only from tool results, say so when data is missing, reply in the language the person writes in (the UI starts in their locale), never give legal advice and add a short note saying so.
- Limit: 20 messages per person per day (`assistant_usage`). No conversation is stored.
- Implementation details and architecture: [`assistant.md`](assistant.md).

## 8. Internationalization

`next-intl` without locale prefixes. Locale from the profile when signed in, otherwise from a cookie, defaulting to English. All UI copy lives in `messages/en.json` and `messages/es.json`; status texts come from USCIS in both languages; plain-English explanations live in the message files per status category.

## 9. Local development and environments

- `npm run setup` (also `make up`): starts Supabase local with the CLI, applies migrations, seeds demo accounts from fixtures, and starts the app with `docker compose up`.
- Without USCIS credentials the mock provider is used automatically.
- Production: Vercel + Supabase cloud + Resend on `kinstamp.com`.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes, cron, seed |
| `USCIS_CLIENT_ID`, `USCIS_CLIENT_SECRET`, `USCIS_TOKEN_URL`, `USCIS_API_BASE_URL` | USCIS API |
| `RESEND_API_KEY`, `EMAIL_FROM` | Status-change emails (Auth emails use Resend SMTP configured in Supabase) |
| `ANTHROPIC_API_KEY` | Case assistant |
| `CRON_SECRET` | Protects the cron route |
| `NEXT_PUBLIC_SITE_URL` | Links in emails and auth redirects |

### Pre-checked sandbox cases

During sandbox hours before delivery, every one of the 50 sandbox receipt numbers is checked once against the real API (50 of the 1,000 daily checks) and stored in production as a regular case. A reviewer who adds any sandbox receipt on a weekend gets real, previously checked data right away, labeled with the time of that check and the offline banner. Nothing is simulated (ADR 0003): it is the same path as a case another person already tracks.

- It runs as an explicit script (`npm run precheck:sandbox`), not as hidden app logic, and refuses to run against a non-sandbox base URL.
- The 50 receipt numbers are public test data published by USCIS; no personal data is involved. With real receipt numbers Kinstamp never checks a case nobody asked for, since that would mean querying someone's immigration data without their consent. The README states this.
- Pre-checked cases have no tracked cases, so they never count in insights. The clean-up in 4.7 only removes cases whose last tracked case was deleted with an account, not cases that were never tracked.

### Demo accounts

Seeded by a script from recorded fixtures, so they work at any hour: one client with 4–5 tracked cases (with and without USCIS history, different form types, key dates, consent on), one attorney with shares from that client. Credentials are in the README. The seed can be re-run to restore them.

## 10. Testing

- Vitest on `src/lib/`: receipt validation and normalization, response parsing (every fixture), error mapping (every shape), change detection, history merge, categorization, case age vs official time, `.ics` generation, the "needs review" rule, attorney note validation and the `mailto:` link.
- pgTAP on the database (`npm run test:db`): RLS isolation (`rls.test.sql`), insights thresholds, and attorney notes, reviews and client contact (`attorney_tools.test.sql`).
- CI on GitHub Actions: lint, typecheck, tests on every push.
- Manual checklist before delivery: R1–R7 with two accounts, RLS isolation, out-of-hours behavior, mobile layout.

## 11. Out of scope (README "What I'd do next")

Full-text search of notices, SMS/WhatsApp, voice agent, multiple roles per account, law-firm organizations and teams, end-to-end tests, refreshing official processing times automatically, persisted assistant conversations, production USCIS access.

## 12. Open items

- **[fixtures]** Status code and body for a well-formed receipt that does not exist; behavior on `429`.
- **[fixtures]** Whether the current status also appears as the last entry of `hist_case_status`.
- **[fixtures]** Real status titles and form types in the sandbox receipts, to finalize `categorize` and choose the demo cases.
