# USCIS Case Status API reference

Source: the Case Status API page on the USCIS Torch developer portal (`developer.uscis.gov/api/case-status`, v1.0.0) and its Sandbox page. Items marked **verified** were confirmed with real calls.

## Authentication

OAuth 2.0 client credentials.

```
POST https://api-int.uscis.gov/oauth/accesstoken
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=…&client_secret=…
```

Response (**verified**, HTTP 200): `access_token`, `token_type: "Bearer"`, `expires_in: "1799"` (about 30 minutes, returned as a string), `issued_at`, `status: "approved"`. Tokens are cached on the server and renewed shortly before they expire.

## Get a case

```
GET https://api-int.uscis.gov/case-status/{receiptNumber}
Authorization: Bearer <token>
```

### Success response

```json
{
  "case_status": {
    "receiptNumber": "EAC9999103403",
    "formType": "I-130",
    "submittedDate": "09-05-2023 14:28:46",
    "modifiedDate": "09-05-2023 14:28:46",
    "current_case_status_text_en": "Case Was Approved",
    "current_case_status_desc_en": "On September 5, 2023, we approved your Form I-130, ...",
    "current_case_status_text_es": "Caso Fue Aprobado",
    "current_case_status_desc_es": "El 05 de Septiembre de 2023, aprobamos su Formulario I-130, ...",
    "hist_case_status": [
      {
        "date": "2023-09-05",
        "completed_text_en": "We approved your Form I-130, Petition for Alien Relative.",
        "completed_text_es": "Aprobamos su Formulario I-130, Petición de Familiar Extranjero."
      }
    ]
  },
  "message": "Query was successful for payload {'receipt_number': 'ABC1234567890'}"
}
```

What matters for Kinstamp:

- **USCIS returns its own history** (`hist_case_status`) for some cases. Those entries become _reported_ status events (ADR 0002).
- `modifiedDate` also changes for internal updates that do not affect the outcome, so it is not used to detect a status change.
- Two date formats: `submittedDate` and `modifiedDate` are `MM-DD-YYYY HH:mm:ss` with no time zone; `hist_case_status[].date` is `YYYY-MM-DD`.
- Status texts come in **English and Spanish**; both are stored.
- Receipt numbers starting with `IOE` use the same shape **without** `submittedDate` and `modifiedDate`.

### Errors

- Documented schema (`ErrorRequest`): `{ "message": string }`.
- Outside sandbox hours (**verified**, HTTP 503): `{ "error": { "code": "503", "message": "The Case Status API Sandbox is unavailable at this time. Please retry your API request during normal operation hours M-F 7:00AM EST - 8:00 PM EST" } }`.
- The Sandbox page also describes an RFC 9457-style body: `code`, `message`, `category`, `reference`, `status`, `traceId`.

The client accepts all three shapes and always extracts a `message`.

## Sandbox receipt numbers

The sandbox only accepts these staging receipt numbers, not real cases.

**With history (`hist_case_data`):**
EAC9999103403, EAC9999103404, EAC9999103405, EAC9999103410, EAC9999103411, EAC9999103416, EAC9999103419, LIN9999106498, LIN9999106499, LIN9999106504, LIN9999106505, LIN9999106506, SRC9999102777, SRC9999102778, SRC9999102779, SRC9999102780, SRC9999102781, SRC9999102782, SRC9999102783, SRC9999102784, SRC9999102785, SRC9999102786, SRC9999102787, SRC9999132710, SRC9999132719

**Without history:**
EAC9999103400, EAC9999103402, EAC9999103406, EAC9999103407, EAC9999103408, EAC9999103409, EAC9999103412, EAC9999103413, EAC9999103414, EAC9999103415, EAC9999103420, EAC9999103421, EAC9999103424, EAC9999103425, EAC9999103426, EAC9999103428, EAC9999103429, EAC9999103431, EAC9999103432, LIN9999106501, LIN9999106507, SRC9999132694, SRC9999132695, SRC9999132706, SRC9999132707

## Limits and availability

| | Sandbox | Production |
|---|---|---|
| Daily quota | 1,000 | 400,000 (resets at midnight Eastern) |
| Throughput | 5 per second (1 every 200 ms) | 10 per second (1 every 100 ms) |
| Hours | Monday to Friday, 7am–8pm Eastern (from the 503 message; not in the docs) | Not stated |
| Receipt numbers | Staging only | Live only |
