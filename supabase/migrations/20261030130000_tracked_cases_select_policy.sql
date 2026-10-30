-- Adding a case (`insert into tracked_cases ... returning id`) failed with 42501 for every client.
-- The select policy called owns_tracked_case(id), a STABLE function: it runs on the snapshot taken
-- before the statement, so it cannot see the row being inserted and the RETURNING check fails.
-- The row itself says who owns it, so the ownership test does not need a function at all.

drop policy "tracked_cases: read own or shared" on public.tracked_cases;
create policy "tracked_cases: read own or shared" on public.tracked_cases
  for select to authenticated using (
    client_id = (select auth.uid()) or public.is_shared_attorney(id)
  );
