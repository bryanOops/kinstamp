import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createUscisClient, type GetCaseResult, type UscisClient } from "./client";
import { parseCaseStatusResponse } from "./parse-response";
import { classifyUscisError } from "./classify-error";

export type { GetCaseResult, UscisClient } from "./client";
export type { CaseSnapshot } from "./parse-response";
export type { UscisError, UscisErrorCode } from "./classify-error";
export { parseReceiptNumber } from "./receipt-number";

let client: UscisClient | null = null;

/**
 * The USCIS client for this process. Without credentials (local development and
 * tests) it answers from recorded real responses instead (ADR 0003): production
 * always has credentials and never uses recordings.
 */
export function getUscisClient(): UscisClient {
  if (client) return client;
  const { USCIS_CLIENT_ID, USCIS_CLIENT_SECRET, USCIS_TOKEN_URL, USCIS_API_BASE_URL } = process.env;

  if (USCIS_CLIENT_ID && USCIS_CLIENT_SECRET && USCIS_TOKEN_URL && USCIS_API_BASE_URL) {
    client = createUscisClient({
      clientId: USCIS_CLIENT_ID,
      clientSecret: USCIS_CLIENT_SECRET,
      tokenUrl: USCIS_TOKEN_URL,
      baseUrl: USCIS_API_BASE_URL,
    });
  } else if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    throw new Error("USCIS credentials are missing in production.");
  } else {
    client = createRecordedUscisClient();
  }
  return client;
}

/** Answers from `__fixtures__/recorded/<receipt>.json` (status + body of a real response). */
function createRecordedUscisClient(): UscisClient {
  return {
    async getCase(receiptNumber): Promise<GetCaseResult> {
      const file = path.join(process.cwd(), "src/lib/uscis/__fixtures__/recorded", `${receiptNumber}.json`);
      const recording = await readFile(file, "utf8")
        .then((text) => JSON.parse(text) as { status: number; body: unknown })
        .catch(() => null);
      if (!recording) {
        return { ok: false, error: classifyUscisError(404, { message: "No recording for this receipt" }), httpStatus: 404 };
      }
      if (recording.status !== 200) {
        return { ok: false, error: classifyUscisError(recording.status, recording.body), httpStatus: recording.status };
      }
      const parsed = parseCaseStatusResponse(recording.body);
      return parsed.ok
        ? { ok: true, snapshot: parsed.snapshot, httpStatus: 200 }
        : {
            ok: false,
            error: { code: "unexpected_response", message: null, retryable: false, outsideHours: false },
            httpStatus: 200,
          };
    },
  };
}
