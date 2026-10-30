# Kinstamp

Kinstamp lets families follow their USCIS cases over time and share them with their attorney. The language below is the one used in code, UI and docs.

## Cases

**Receipt number**:
The 13-character identifier USCIS assigns to a filed form: three letters followed by ten digits (e.g. `EAC9999103403`).
_Avoid_: Case number, case ID, receipt ID

**Case**:
One USCIS filing, identified by its receipt number. A case exists once, no matter how many people follow it.
_Avoid_: Application, petition, filing

**Form type**:
The USCIS form a case was filed with, such as `I-130` or `I-485`.
_Avoid_: Case type, category

**Tracked case**:
A client's link to a case, with the client's own nickname for it. Several clients can track the same case independently.
_Avoid_: Saved case, watch, subscription

**Status**:
The current title USCIS gives a case, such as "Case Was Received".
_Avoid_: State, stage

**Status event**:
One entry in a case's history: a date, a status title and description, and its origin, either _reported_ (listed in USCIS's own history) or _observed_ (detected by Kinstamp during a check). Status events are never changed once recorded.
_Avoid_: Update, change log entry

**Timeline**:
A case's status events in date order.
_Avoid_: History feed, activity

**Key date**:
A date taken from a USCIS notice that matters for a case: a _due date_ to respond by, or an _appointment_ to attend. Entered by a person, never calculated by Kinstamp.
_Avoid_: Deadline, reminder, event

## Checks

**Check**:
One query to USCIS for a case, whatever triggered it.
_Avoid_: Fetch, sync, lookup

**Refresh**:
A check requested by a person.
_Avoid_: Reload, update

**Scheduled check**:
A check Kinstamp runs on its own, without anyone asking.
_Avoid_: Cron job, auto-refresh, poll

## People

**Client**:
A person who tracks cases for themselves or their relatives and can share them with an attorney.
_Avoid_: Applicant, petitioner, beneficiary (those are USCIS roles on a form), customer

**Attorney**:
A person who represents clients before USCIS and sees only the cases shared with them.
_Avoid_: Lawyer, representative, preparer

**Share**:
Access to a tracked case, granted by a client to an attorney's email address. The attorney can view and refresh the case and add key dates, nothing else. It stays pending until that email belongs to an attorney account, and it can be revoked.
_Avoid_: Invite, permission, access grant

## Data and insights

**Consent**:
A person's opt-in permission to include their cases, anonymized, in insights. It can be revoked at any time.
_Avoid_: Opt-in, data sharing agreement

**Official processing time**:
The time USCIS publishes for a form type to be completed, recorded with its source and the date it was read.
_Avoid_: Estimate, wait time

**Insight**:
An aggregate figure computed only from consented cases and shown only for groups large enough that no case can be singled out.
_Avoid_: Stat, analytics, report
