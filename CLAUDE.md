# Kinstamp

Take-home exercise for Monogram: Kinstamp lets families track their USCIS cases and share them with their attorney.

- Domain language: `GLOSSARY.md`. Use its terms in code, UI and docs.
- Architecture decisions: `docs/adr/`. Record a new ADR only for decisions that are hard to reverse, surprising and a real tradeoff; smaller decisions go in the README "Key decisions" table.
- Product and technical spec: `docs/spec.md`. It is the "Spec" axis for `/mp-code-review`.
- USCIS API reference: `docs/uscis-api.md`.
- Next.js 16 has breaking changes: read `AGENTS.md` and the bundled docs in `node_modules/next/dist/docs/` before writing Next.js code.
- `.workspace/` holds private working notes in Spanish (plan, grilling decisions, design prompts). It is git-ignored and never part of the deliverable.

## Language

- Code, file names, identifiers, commits, README and `docs/` are in English: the repo is reviewed by a US team.
- UI copy is never hard-coded in components; it lives in `messages/en.json` and `messages/es.json` via `next-intl`.

## Coding standards

These rules are the reference for `/mp-code-review`.

### React and Next.js (App Router)
- Server Components by default. `"use client"` only on the leaf component that needs state, events or browser APIs, never on whole pages or layouts.
- Read data in Server Components. Mutations go through Server Actions validated with Zod. Route Handlers only for non-UI entry points (cron, webhooks).
- Form and action state with `useActionState` and `useFormStatus`; `useOptimistic` where it improves perceived speed.
- No `useEffect` to fetch data or derive state: data comes from the server, derived values are computed during render.
- Reusable client logic lives in custom hooks (`useXxx`) under `src/hooks/`.
- Small, single-purpose components with typed props. UI primitives in `src/components/ui/` (shadcn/ui); domain components in `src/components/<domain>/`. If something is repeated twice, extract it.
- Every route has loading (`loading.tsx` or `Suspense`), empty and error (`error.tsx`) states.
- Accessibility: semantic elements, a `label` for every field, visible focus, status is never conveyed by color alone.

### TypeScript
- `strict` on. No `any`; use `unknown` and narrow.
- Every external input (forms, USCIS responses, environment variables) is validated with Zod at the boundary and typed from the schema (`z.infer`).
- Database types are generated with `supabase gen types`, never written by hand.

### Data and security
- USCIS is called only from the server (`server-only`). Credentials live only in environment variables, never in the client or the repo.
- Every table has RLS enabled with explicit policies. Security never depends on filters in application code.
- Status history is append-only: events are never updated or deleted.
- The Supabase service-role key is used only on the server, in cron jobs and scripts.

### Structure
- `src/app/`: routes.
- `src/components/`: UI.
- `src/lib/<module>/`: pure, React-free, testable domain logic, e.g. `src/lib/uscis/` (client, parser, errors) and `src/lib/cases/` (change detection, history merge).
- `src/server/`: Server Actions and data access.
- `supabase/migrations/`: versioned schema.

### Errors
- USCIS errors map to an internal type (`invalid_receipt`, `not_found`, `unavailable`, `rate_limited`, `timeout`, `unknown`) with a translated user-facing message. Stack traces are never shown.
- Every external call has a timeout.

### Tests
- Vitest for `src/lib/`. Every API edge case has a test, using real responses stored in `src/lib/uscis/__fixtures__/`.
- Critical logic is written test-first (`/tdd`).
- CI (GitHub Actions) runs lint, typecheck and tests on every push.

### Commits
- Small, in English, Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
