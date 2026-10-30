# Case assistant

"Ask about this case" (spec E7): an agent that answers questions like "what does this status mean?", "what's next?" or "is my case slow?" using only the data of the case the person is looking at.

## Architecture

```
 Browser (case detail page)
 ┌───────────────────────────────────────────────────────────┐
 │ assistant-panel.tsx ◄── use-assistant-chat.ts              │  conversation lives in memory only
 └───────────────┬───────────────────────────────────────────┘
                 │ POST /api/assistant { trackedCaseId, messages }
                 ▼
 Vercel function: src/app/api/assistant/route.ts
 ┌───────────────────────────────────────────────────────────┐
 │ 1. Input guardrails                                        │
 │    session ─ Zod (1–20 messages, ≤ 2000 chars) ─           │
 │    can this person see the case? (RLS) ─ 20 messages/day   │
 │                                                            │
 │ 2. Agent loop (Anthropic SDK toolRunner, ≤ 6 iterations)   │
 │    ┌──────────────┐  tool call   ┌──────────────────────┐  │
 │    │ Claude       │ ───────────► │ tools.ts             │  │
 │    │ (system      │ ◄─────────── │ 5 read-only tools,   │  │
 │    │  prompt)     │  tool result │ person's own session │  │
 │    └──────────────┘              └──────────┬───────────┘  │
 │                                             ▼              │
 │                     queries.ts ──► Supabase Postgres (RLS) │
 │                     official-processing-times.json         │
 │                                                            │
 │ 3. Stream text deltas back; refusals and errors become a   │
 │    translated notice                                       │
 └───────────────────────────────────────────────────────────┘
```

## Files

| File                                                    | Role                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/api/assistant/route.ts`                        | Entry point: auth, request validation, access check, daily limit, system prompt, agent loop, streaming        |
| `src/server/assistant/tools.ts`                         | The five tools, scoped to one tracked case                                                                    |
| `src/server/cases/queries.ts`                           | Data access the tools reuse (`getTrackedCaseDetail`, `listInsights`), run with the signed-in person's session |
| `src/lib/processing-times/official.ts`                  | Official USCIS processing time for the form                                                                   |
| `src/hooks/use-assistant-chat.ts`                       | Client: sends the conversation, reads the stream, maps errors to messages                                     |
| `src/components/assistant/`                             | Panel UI (`assistant-panel.tsx`) and its wired container (`wired/assistant-control.tsx`)                      |
| `supabase/migrations/20261030070000_initial_schema.sql` | `assistant_usage` table, used for the daily limit                                                             |
| `messages/en.json`, `messages/es.json`                  | `assistant.*` copy, including error and refusal notices                                                       |

## The loop

1. The person asks a question in the panel. The client sends the whole conversation (it is not stored on the server).
2. The route validates the request, checks that the person can see the case through RLS, and records one row in `assistant_usage`.
3. The SDK's `toolRunner` calls Claude with the system prompt and the tools. Claude decides which tools to call. The runner executes them and returns the results. This repeats until Claude answers, for at most 6 iterations.
4. Text is streamed to the browser as it is generated.

## Tools

All tools take no input: they are bound to the tracked case of the request, so the model cannot ask for another case. They reuse the app's own queries, so RLS applies exactly as it does on the page.

| Tool                           | Returns                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_case_overview`            | Nickname, receipt number, form, current status and description (English and Spanish), category, submission date, last check and its error, if any |
| `get_timeline`                 | Status history, oldest first, with its origin (reported by USCIS or observed by Kinstamp)                                                         |
| `get_key_dates`                | Due dates and appointments the client or the attorney copied from USCIS notices                                                                   |
| `get_official_processing_time` | USCIS published processing time for the form, with source and retrieval date                                                                      |
| `get_insights`                 | Anonymous durations (received to approved) from consented cases of the same form; null below 5 cases                                              |

## System prompt rules

- Base every fact about the case on tool results; say plainly when Kinstamp does not have the data.
- Never estimate dates, outcomes or approval chances. General explanations of a status and its usual next step are allowed.
- Reply in the language the person writes in.
- Keep answers short.
- It is not a lawyer: questions that need legal judgment go to the attorney, and every answer ends with a short note saying it is not legal advice.

## Guardrails and cost

| Concern               | How it is handled                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data access           | Tools are read-only, bound to one case and run under RLS with the person's session                                                                                          |
| Abuse and cost        | 20 messages per person per day; conversation capped at 20 messages of 2000 characters                                                                                       |
| Runaway loops         | `max_iterations: 6`, `max_tokens: 8000`, function `maxDuration = 60`                                                                                                        |
| Latency and cost      | `effort: "low"` (short answers over a few lookups) and prompt caching (`cache_control`), so the system prompt and tools are not billed in full on every iteration           |
| Refusals and failures | If a safety classifier declines, the API retries on a fallback model (`fallbacks: "default"`); a final refusal or an error becomes a translated notice, never a stack trace |

## Agent concepts we chose not to use

| Concept                        | Why not here                                                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RAG with embeddings / pgvector | The data is small and structured (statuses, dates, receipts). Tools fetch exactly what is needed; semantic search adds nothing. It would make sense for long documents such as USCIS policy manuals. |
| Structured output              | The answer is prose for a person to read and is not stored. Zod validates the request and the tool definitions.                                                                                      |
| Persistent memory              | Conversations involve sensitive immigration data, so they are not stored. Listed in "What I'd do next" with explicit consent.                                                                        |
| MCP                            | The tools live inside the app and are not shared with other clients.                                                                                                                                 |
| Background jobs                | An answer takes seconds and fits in one function call. Scheduled USCIS checks are the app's background job (Vercel Cron).                                                                            |
| Human-in-the-loop              | The assistant only reads. If it ever writes (for example, adding a key date), each action would need the person's approval.                                                                          |

## Known gaps

- **Observability:** only errors are logged (Vercel logs). The next step is to record tokens, iterations and tools used per message in `assistant_usage`.
- **Evals:** there is no fixed question set that checks language, refusal to estimate dates, the legal note and tool use when the prompt or model changes.
