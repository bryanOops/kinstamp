# One case per receipt number, tracked by many clients

A case exists once per receipt number, and clients link to it through their own tracked case (with their own nickname). The obvious alternative was a private copy of the case and its history per client. We chose the shared case because a family and its attorney often follow the same receipt: one check updates everyone, which matters with the sandbox quota of 1,000 checks a day, and insights count each case once instead of once per follower.

## Consequences

- Authorization is no longer "rows I own": a client reads a case because they track it, and an attorney because a tracked case was shared with them. This lives in RLS policies (see ADR 0004) and is tested with two accounts.
- Clients never write to a case directly. Cases and status events are written only by the server after a check.
