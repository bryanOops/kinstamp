import { classifyUscisError, type UscisError, type UscisErrorCode } from "./classify-error";
import { parseCaseStatusResponse, type CaseSnapshot } from "./parse-response";

export type UscisClientConfig = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  baseUrl: string;
  fetch?: typeof fetch;
  /** Per-request timeout. */
  timeoutMs?: number;
  /** Injected for tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export type GetCaseResult =
  | { ok: true; snapshot: CaseSnapshot; httpStatus: number }
  | { ok: false; error: UscisError; httpStatus: number | null };

export interface UscisClient {
  getCase(receiptNumber: string): Promise<GetCaseResult>;
}

/** Renew the token this long before USCIS says it expires. */
const TOKEN_SAFETY_MARGIN_MS = 60_000;
const RETRY_DELAY_MS = 500;

type Attempt =
  | { ok: true; httpStatus: number; body: unknown }
  | { ok: false; error: UscisError; httpStatus: number | null };

class TokenError extends Error {}

export function createUscisClient(config: UscisClientConfig): UscisClient {
  const fetchFn = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 8_000;
  const now = config.now ?? Date.now;
  const sleep = config.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let cachedToken: { value: string; expiresAt: number } | null = null;

  async function getToken(): Promise<string> {
    if (cachedToken && now() < cachedToken.expiresAt - TOKEN_SAFETY_MARGIN_MS) return cachedToken.value;

    const response = await fetchFn(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = (await response.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
    if (!response.ok || typeof body?.access_token !== "string") throw new TokenError();

    const expiresInSeconds = Number(body.expires_in) || 0;
    cachedToken = { value: body.access_token, expiresAt: now() + expiresInSeconds * 1000 };
    return cachedToken.value;
  }

  async function attempt(receiptNumber: string): Promise<Attempt> {
    try {
      const token = await getToken();
      const response = await fetchFn(`${config.baseUrl}/${encodeURIComponent(receiptNumber)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.ok) return { ok: true, httpStatus: response.status, body };
      if (response.status === 401) cachedToken = null;
      return { ok: false, error: classifyUscisError(response.status, body), httpStatus: response.status };
    } catch (error) {
      if (error instanceof TokenError) return failure("auth_failed", false);
      if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
        return failure("timeout", true);
      }
      return failure("unavailable", true);
    }
  }

  return {
    async getCase(receiptNumber) {
      let result = await attempt(receiptNumber);
      if (!result.ok && result.error.retryable) {
        // A rejected token is renewed right away; other transient errors wait a moment.
        if (result.error.code !== "auth_failed") await sleep(RETRY_DELAY_MS);
        result = await attempt(receiptNumber);
      }
      if (!result.ok) return result;

      const parsed = parseCaseStatusResponse(result.body);
      return parsed.ok
        ? { ok: true, snapshot: parsed.snapshot, httpStatus: result.httpStatus }
        : { ok: false, error: { ...failure("unexpected_response", false).error }, httpStatus: result.httpStatus };
    },
  };
}

function failure(code: UscisErrorCode, retryable: boolean): { ok: false; error: UscisError; httpStatus: null } {
  return { ok: false, error: { code, message: null, retryable, outsideHours: false }, httpStatus: null };
}
