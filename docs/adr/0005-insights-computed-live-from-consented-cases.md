# Insights are computed live, only from consented cases

Insights are calculated at query time from the cases of clients who currently give consent, and any group with fewer than 5 cases is hidden. They never expose receipt numbers, nicknames or people. We considered storing pre-aggregated anonymized snapshots, which scale better, but a client who revokes consent would stay inside numbers they can no longer leave. Computing live means revoking consent takes effect immediately and deleting an account leaves nothing behind.

## Consequences

- Fine at this volume. With real traffic, periodic aggregates that cannot be re-identified would replace live queries.
- Consent is opt-in and off by default, so insights start nearly empty; official processing times cover that gap.
