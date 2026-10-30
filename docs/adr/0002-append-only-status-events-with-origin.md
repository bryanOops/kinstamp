# Append-only status events, each with an origin

A case's history is stored as status events that are only ever inserted, never updated or deleted. Each event records its origin: _reported_ when it comes from the `hist_case_status` list USCIS returns, or _observed_ when Kinstamp detected a new status during a check. We considered keeping only the current status plus an `updated_at`, which is simpler, but it loses exactly what the exercise asks for (every status and when it changed) and what insights need (durations between statuses).

## Consequences

- The timeline is complete from the first check, thanks to reported events, and keeps growing with observed ones.
- Insights can tell official dates (reported) from dates whose precision depends on how often the case was checked (observed).
- A change is detected by comparing the normalized status title with the latest event, not `modifiedDate`, which USCIS also bumps for internal updates.
- Reported events are de-duplicated by date and text, observed events by status title. Reported entries are worded differently from status titles ("We approved your Form I-130…" vs "Case Was Approved"), so an observed event is not merged with a later reported one; both stay on the timeline with their origin.
