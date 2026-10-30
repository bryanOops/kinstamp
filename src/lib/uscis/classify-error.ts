export type UscisErrorCode =
  | "invalid_receipt"
  | "not_found"
  | "unavailable"
  | "rate_limited"
  | "quota_exhausted"
  | "timeout"
  | "auth_failed"
  | "unexpected_response"
  | "unknown";

export type UscisError = {
  code: UscisErrorCode;
  /** Text from USCIS, when it sent one. The UI shows a translated message per code. */
  message: string | null;
  /** True when retrying the same request soon can succeed. */
  retryable: boolean;
  /** The sandbox only answers Monday to Friday, 7am–8pm Eastern. */
  outsideHours: boolean;
};

export function classifyUscisError(httpStatus: number, body: unknown): UscisError {
  const message = extractMessage(body);
  const outsideHours = httpStatus === 503 && /operation hours/i.test(message ?? "");
  const { code, retryable } = outsideHours ? { code: "unavailable" as const, retryable: false } : byStatus(httpStatus);

  return { code, message, retryable, outsideHours };
}

function byStatus(httpStatus: number): { code: UscisErrorCode; retryable: boolean } {
  if (httpStatus === 400) return { code: "invalid_receipt", retryable: false };
  if (httpStatus === 404) return { code: "not_found", retryable: false };
  // 401 usually means the cached token expired: retry once with a new one.
  if (httpStatus === 401) return { code: "auth_failed", retryable: true };
  if (httpStatus === 403) return { code: "auth_failed", retryable: false };
  if (httpStatus === 429) return { code: "rate_limited", retryable: true };
  if (httpStatus >= 500) return { code: "unavailable", retryable: true };
  return { code: "unknown", retryable: false };
}

function extractMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const nested = record.error;
  if (typeof nested === "object" && nested !== null) {
    const text = (nested as Record<string, unknown>).message;
    if (typeof text === "string") return text;
  }
  return typeof record.message === "string" ? record.message : null;
}
