# Kinstamp

**USCIS case tracking for families and their attorneys.**

Kinstamp (*kin* + *stamp*: built for families waiting on USCIS) lets a family save their USCIS receipt numbers, see each case's current status and full history, understand what it means in plain language, and share a case with their attorney, who sees only what was shared.

- **Live app:** https://kinstamp.com (also https://kinstamp.vercel.app)
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres, Auth, RLS) · Vercel · Tailwind v4 + shadcn/ui · Zod · Vitest + pgTAP · Claude API

---

## Try it

### The mental model

USCIS's case status is a public board: anyone who knows a receipt number can read that case's status there, and the board never shows personal data. Kinstamp is a family's private notebook on top of that board: which cases they follow, what they call them, the deadlines they copy from USCIS letters, which attorney may look, and a daily check that writes down every change and emails them. The board is public; the notebook is theirs alone. The first sign-in walks new accounts through this, and the Help button replays it.

### Demo accounts

The demo accounts hold only USCIS sandbox data, so their credentials are public on purpose (in a real product they would never be published). If someone changes them, `npm run seed:demo -- --production` restores them.

| Role | Email | Password |
|---|---|---|
| Client (family) | `demo-client@kinstamp.com` | `kinstamp-demo-2026` |
| Attorney | `demo-attorney@kinstamp.com` | `kinstamp-demo-2026` |

The client tracks four sandbox cases; two are shared with the attorney. Open both in two browser windows to see sharing and its limits.

### The end-to-end flow

1. **Sign up** at `/sign-up` as a client (or use the demo client). Confirm your email from the link we send.
2. **Add a case** with a sandbox receipt number, e.g. `LIN9999106498`, `EAC9999103406`, `SRC9999132694` (the dialog lists a few; the full list is in [`docs/uscis-api.md`](docs/uscis-api.md)).
3. **Refresh** it, read its **timeline** (history reported by USCIS plus changes Kinstamp observes), switch the status between English and Spanish.
4. **Share** it with an attorney's email. Sign in as that attorney: the case appears in *Clients' cases*. Revoke it and it disappears immediately.

### About the USCIS sandbox

The USCIS sandbox **only answers Monday to Friday, 7am–8pm Eastern** and only knows its [50 published test receipts](docs/uscis-api.md#sandbox-receipt-numbers), whose statuses never change. Kinstamp is built for that reality instead of hiding it:

- Outside those hours every case shows its **last saved status** with a clear "USCIS is offline" notice and the time of the last successful check. Nothing is ever simulated in production ([ADR 0003](docs/adr/0003-never-simulate-uscis-data-in-production.md)).
- All 50 sandbox receipts were **checked once ahead of time** and stored as regular cases, so adding one on a weekend still shows real data. This is only done for public sandbox receipts: with real receipt numbers Kinstamp never checks a case nobody asked for.
- A refresh against the sandbox always returns "No changes". Change detection is covered by unit tests on recorded real responses.
- **Insights stays empty in production, on purpose.** It only counts consenting people's cases, in groups of at least 5, and every sandbox history has "received" and "approved" on the same day (September 5, 2023), so there is no real duration to show. Filling it with invented cases would break the rule above; the SQL behind it is covered by pgTAP tests with realistic fixtures.

---

## Run it locally

**Requirements:** Docker Desktop and Node.js 22.

```bash
git clone https://github.com/bryanOops/kinstamp.git
cd kinstamp
npm install
npm run setup
```

`npm run setup` starts Supabase locally (Postgres, Auth, Studio and a test inbox, all in Docker through the official Supabase CLI), applies the migrations, writes the local keys into `.env.local`, and builds and starts the app container.

| | URL |
|---|---|
| App | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Test inbox (confirmation and notification emails) | http://127.0.0.1:54324 |

Then `npm run seed:demo` creates the demo accounts locally.

**Without USCIS credentials** the app answers from real sandbox responses recorded in [`src/lib/uscis/__fixtures__/recorded`](src/lib/uscis/__fixtures__/recorded), so everything works at any hour. To use the live sandbox, create an app on the [USCIS developer portal](https://developer.uscis.gov/) and fill `USCIS_CLIENT_ID` / `USCIS_CLIENT_SECRET` in `.env.local` (see [`.env.example`](.env.example) for every variable).

To develop without the app container: `npm run setup -- --no-app`, then `npm run dev`.

### Seeing a status change

Sandbox cases never change, so the change detection, the "New" timeline event and the status-change email cannot be triggered from USCIS itself. Locally you can provoke one honestly (production never simulates data, [ADR 0003](docs/adr/0003-never-simulate-uscis-data-in-production.md)):

1. Sign in as the demo client, open *Mom's petition* (`EAC9999103403`) and keep "Email me when a case status changes" on in Settings.
2. In Supabase Studio (http://127.0.0.1:54323) → `status_events`, find that case's row with `origin = observed` and change its `text_en` to `Case Was Received`.
3. Wait a minute (a check younger than 60 seconds is reused) and press **Refresh**.

USCIS still answers "Case Was Approved", so Kinstamp sees a change: the page shows *Status changed*, the timeline gets a new event marked *Observed by Kinstamp*, `case_checks` records `result = changed`, and the email lands in the local inbox (http://127.0.0.1:54324). The daily cron does exactly this for every tracked case.

### Useful scripts

| Command | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Database tests (pgTAP): RLS isolation, sharing, insights privacy |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript (also run in CI on every push) |
| `npm run seed:demo` | (Re)create the demo accounts |
| `npm run record:sandbox` | Record real sandbox responses as fixtures (sandbox hours only) |
| `npm run precheck:sandbox` | Check the 50 sandbox receipts once and store them |
| `npm run down` | Stop the app container and Supabase |

---

## Architecture

```
Browser ──► Next.js on Vercel (Server Components, Server Actions, Route Handlers)
              │  reads as the signed-in person ──► Supabase Postgres (RLS on every table)
              │  writes checks with the service role (after access is verified)
              ├─► USCIS Case Status API (OAuth client credentials, server only)
              ├─► Resend (confirmation and status-change emails)
              └─► Claude API (case assistant, read-only tools)
Vercel Cron (weekdays, 10am ET) ──► /api/cron/scheduled-checks
```

- **`src/lib/`**: pure, React-free domain logic with unit tests: receipt validation, USCIS response parsing and error mapping (`uscis/`), change detection and status categories (`cases/`), time zones, ICS generation.
- **`src/server/`**: the data access layer: auth (`getCurrentProfile`, `requireProfile`), queries, Server Actions, the check runner, notifications, the assistant's tools.
- **`src/app/`**, **`src/components/`**: routes and UI. Server Components by default; client components only where there is interaction.
- **`supabase/migrations/`**: the schema, RLS policies and SQL functions; **`supabase/tests/`**: pgTAP tests.

The case assistant (agent loop, tools, guardrails and what was deliberately left out) is documented in [`docs/assistant.md`](docs/assistant.md).

The coding standards that every change (human or AI) follows are in [`CLAUDE.md`](CLAUDE.md); the domain language is in [`GLOSSARY.md`](GLOSSARY.md); the product and technical spec is [`docs/spec.md`](docs/spec.md).

### Data model

| Table | Holds |
|---|---|
| `profiles` | One per account: name, role (`client` / `attorney`), language, email preference |
| `consents` | Opt-in to anonymous insights, with grant and revoke dates (append-only history) |
| `cases` | **One row per receipt number** with its current status ([ADR 0001](docs/adr/0001-one-case-per-receipt-number.md)) |
| `status_events` | **Append-only history**: every status with its date and origin, `reported` by USCIS or `observed` by Kinstamp, and a category ([ADR 0002](docs/adr/0002-append-only-status-events-with-origin.md)) |
| `case_checks` | Every call to USCIS: trigger, result, error, latency. Audit trail and quota accounting |
| `tracked_cases` | A client's link to a case, with their own nickname |
| `shares` | A tracked case shared with an attorney's email; pending until that attorney signs up; revocable |
| `key_dates` | Due dates and appointments copied from USCIS notices, by the client or the attorney |
| `notifications_sent`, `assistant_usage` | Idempotent emails and assistant rate limits |

**Why it is ready for insights.** Each case exists once, so it is counted once. Its history never changes, has dates, and every event carries a category (`received`, `evidence_requested`, `approved`, …) and an origin, so durations such as "received → approved for I-130" are a single query. Consent is its own table with dates. Insights are computed **live, only from cases of people who currently consent, and never for groups smaller than 5** ([ADR 0005](docs/adr/0005-insights-computed-live-from-consented-cases.md)): revoking consent takes effect immediately and nothing identifies a person, a receipt or a nickname. Sharing data with other businesses would follow the same rule: aggregates only, from consented cases, above the minimum group size.

### Security

- **Authorization lives in Postgres row-level security**, not in application filters ([ADR 0004](docs/adr/0004-authorization-in-postgres-rls.md)). Clients read only cases they track; attorneys only cases actively shared with their **confirmed** email; nobody can change their role or write to cases or history. 26 pgTAP tests check this and the insights privacy rules with several accounts (`npm run test:db`).
- **A receipt number is the only key to a case**, exactly as on USCIS's public status page: the API has no notion of ownership and returns no personal data, so two people can track the same receipt. Everything a person adds on top (that they track it, the nickname, key dates, shares) is theirs alone under RLS. Per-person hourly check limits and a daily USCIS budget stop receipt guessing.
- Email confirmation is required: shares are matched by email, so an unconfirmed account must never claim an attorney's address.
- USCIS credentials, the Supabase service-role key and the Anthropic key exist only on the server.
- Post-sign-in redirects only accept same-site paths.

### USCIS integration and edge cases

| Situation | Behavior |
|---|---|
| Malformed receipt | Normalized first (spaces, dashes, lowercase), then rejected with a clear message before calling USCIS |
| Unknown receipt | Not saved; the person is told USCIS doesn't know it |
| Sandbox closed (503 outside hours) | Not retried; last saved status + "USCIS is offline" notice; new cases saved as *waiting for USCIS* and checked automatically later |
| Timeout, network error, 5xx | 8 s timeout, one retry, then the last saved status with a notice |
| Expired token (401) | Token renewed once and the request retried; tokens are cached until a minute before expiry |
| Rate limits | A successful check under 60 s old is reused instead of calling USCIS; 30 USCIS checks per person per hour (adding and refreshing); checks stop at 900/day (sandbox quota is 1,000); scheduled checks are spaced under 5 per second |
| Status unchanged but `modifiedDate` moved | Not a change: changes are detected on the status title, because USCIS bumps `modifiedDate` for internal updates |

---

## Key decisions and tradeoffs

The five decisions that are hardest to reverse have their own ADRs in [`docs/adr/`](docs/adr/). The rest:

| Decision | Why | Tradeoff |
|---|---|---|
| Next.js + Supabase + Vercel | The role's stack; Supabase gives auth and row-level security without building them | Coupled to Postgres/Supabase for authorization |
| Role chosen at sign-up (client or attorney) | Clear demo, simple policies, mirrors how a firm works | An attorney can't track personal cases with the same account |
| Share by email, pending until the attorney signs up | Families know their attorney's email, not an internal ID | Emails must be normalized; a typo leaves a pending share the client can revoke |
| Attorneys can view, refresh and add key dates, nothing else | Refreshing only reads USCIS; letters often reach the attorney first | Their refreshes use the same quota (mitigated by reuse) |
| Opt-in consent, off by default | Respectful and easy to explain | Fewer data points for insights |
| Whole UI in English and Spanish (`next-intl`, JSON messages) | Many families are Spanish-speaking; USCIS already returns status texts in both | Every string is written twice |
| Email confirmation with Resend on our own domain | Supabase's default mailer is rate-limited and lands in spam; the same domain sends status emails | A domain had to be bought |
| No simulated data in production | Showing invented immigration data as real is the one thing this product must not do | On weekends the sandbox can't be queried live |
| Official processing times as a dated copy | The USCIS endpoint is undocumented and blocks automated requests | The figures age (shown with source and date), and the API doesn't say a case's category or office, so each form uses its most common one (I-130: U.S. citizen petitioning for a spouse, parent or child, all field offices) |
| Unit tests + pgTAP + CI; no end-to-end suite | The sandbox never changes statuses, so tests are the proof that change detection works | End-to-end flows were verified by hand |
| Docker + Supabase CLI for local setup | One command for a newcomer; the CLI is Supabase's supported local stack | A few GB of images on first run |

---

## Beyond the spec, and why

The brief's floor is lookup, accounts, saved cases, refresh, history and an insights-ready model. What I added, in the order I'd defend it:

1. **Timeline + plain-language explanations.** The hard part of USCIS isn't fetching a status, it's understanding it. Each status category explains what it means and what usually comes next, in English and Spanish.
2. **Attorney dashboard.** The client behind this exercise is an immigration law firm; attorneys see every case shared with them, sorted by the next key date, with what changed this week.
3. **Key dates that can't be missed.** RFE deadlines and appointments copied from notices, with a countdown, an `.ics` file for the calendar, and urgency ordering for the attorney. Kinstamp never calculates a legal deadline; people copy it from the letter.
4. **"Is my case slow?"** Compares the case's age with the time USCIS publishes for its form, with source and date, and links to USCIS's own inquiry page when it's outside that time.
5. **Insights**, anonymized, from consented cases only.
6. **Scheduled checks + email on change**, so nobody has to remember to refresh.
7. **Case assistant.** An agent (Claude, tool-use loop) that answers "what does this mean / what's next / how long" using only this case's data through read-only tools that run with the person's own permissions, says when it doesn't know, and is explicit that it isn't legal advice.

---

## How I used AI

I used **Claude Code** as the main tool, the way Monogram describes its own workflow: I directed, decided and reviewed; the AI wrote most of the code.

- **Before code:** a structured interview (`/grilling`) to settle 22 product and data decisions with their tradeoffs; `/domain-modeling` to write the glossary and ADRs; then the spec. An "innovation" agent researched competitors and proposed ideas; two of them became extras (key dates, "Is my case slow?").
- **Design:** a design system and screens in Google Stitch as a starting point, then a front-end agent (Claude Fable) rebuilt the visual layer and the transactional emails using UI/UX skills (`impeccable`, `ui-ux-pro-max`, `apple-design`) and the coding standards in `CLAUDE.md`.
- **Logic:** test-first (`/tdd`) for the USCIS client, parsing, error mapping and change detection, with seams agreed before writing tests; RLS verified with pgTAP.
- **Review:** `/mp-code-review` (two parallel reviewers: coding standards and spec) found about a dozen real issues, all fixed: an offline notice that never showed, a quota bypass, shares visible to unconfirmed attorney accounts, account enumeration through sharing, among others. Then `/security-review` on the whole branch.
- **What I checked by hand:** every RLS policy, the end-to-end flows with two accounts, the sandbox's real behavior (its business hours were discovered by calling it, not from the docs), and every claim in this README.

Third-party skills used locally are not committed; install them with `npx skills add pbakaus/impeccable nextlevelbuilder/ui-ux-pro-max-skill emilkowalski/skills`.

---

## What I'd do next

- End-to-end tests (Playwright) for the main flows, running against a seeded database in CI.
- Refresh the official processing times automatically, and per service center.
- Law-firm organizations: several attorneys per firm, client invitations from the attorney side.
- Multiple roles per account, so an attorney can also track personal cases.
- Periodic, non-reidentifiable insight snapshots instead of live queries once volume grows; a consented data product for third parties built on the same rule.
- SMS/WhatsApp notifications; persisted assistant conversations with explicit consent.
- Production USCIS access (requires a demo with USCIS).
