# Never simulate USCIS data in production

The USCIS sandbox only answers Monday to Friday, 7am–8pm Eastern, and returns 503 otherwise, so reviewers may hit it while it is closed. Instead of a simulated mode in production, the deployed app always calls the real API and, when it is unavailable, shows the last saved status with a clear notice and the time of the last successful check. Pre-seeded demo accounts, loaded with real sandbox responses, make the whole flow reviewable at any hour. Simulated responses (real ones recorded as fixtures) are used only in local development without credentials and in tests.

## Considered options

- Simulated mode in production: rejected. Showing invented immigration data as if it were real is the one thing this product must never do.
