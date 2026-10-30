# Authorization lives in Postgres row-level security

Who can see what (clients see the cases they track, attorneys see only what was shared with them, nobody sees anyone else's consent or key dates) is enforced by RLS policies in Postgres rather than by filters in application code. The app queries Supabase as the signed-in user, so a forgotten `where` clause cannot leak data. The service-role key, which bypasses RLS, is used only on the server for checks, scheduled checks and seeding.

## Consequences

- Policies are part of the versioned migrations and are reviewed like code.
- Sharing rules (ADR 0001) are more complex to express in SQL than in TypeScript, so they are tested manually with two accounts and documented next to the policies.
- This ties the data layer to Postgres and Supabase Auth; moving away would mean re-implementing authorization.
