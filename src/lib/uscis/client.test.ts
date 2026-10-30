import { describe, expect, it } from "vitest";
import documentedSuccess from "./__fixtures__/documented-success.json";
import sandboxClosed from "./__fixtures__/sandbox-closed-503.json";
import { createUscisClient } from "./client";

const config = {
  clientId: "id",
  clientSecret: "secret",
  tokenUrl: "https://uscis.test/oauth/accesstoken",
  baseUrl: "https://uscis.test/case-status",
};

type Reply = { status: number; body: unknown } | "hang" | "network-error";

/** A fake USCIS at the HTTP boundary: answers token and case requests from scripted replies. */
function fakeUscis(caseReplies: Reply[], tokenReplies: Reply[] = []) {
  const calls: string[] = [];
  let tokenCount = 0;
  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const isToken = url === config.tokenUrl;
    const reply: Reply = isToken
      ? (tokenReplies.shift() ?? { status: 200, body: { access_token: `token-${++tokenCount}`, expires_in: "1799" } })
      : (caseReplies.shift() ?? { status: 500, body: null });
    if (reply === "network-error") throw new TypeError("fetch failed");
    if (reply === "hang") {
      return new Promise((_, reject) =>
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
      );
    }
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  };
  return { fetch, calls, caseCalls: () => calls.filter((url) => url !== config.tokenUrl) };
}

describe("createUscisClient().getCase", () => {
  it("gets a token, then the case, and returns the parsed snapshot", async () => {
    const uscis = fakeUscis([{ status: 200, body: documentedSuccess }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch });

    const result = await client.getCase("EAC9999103403");

    expect(result.ok && result.snapshot.status.en).toBe("Case Was Approved");
    expect(uscis.calls).toEqual([config.tokenUrl, "https://uscis.test/case-status/EAC9999103403"]);
  });

  it("reuses the token until shortly before it expires", async () => {
    let now = 0;
    const uscis = fakeUscis([
      { status: 200, body: documentedSuccess },
      { status: 200, body: documentedSuccess },
      { status: 200, body: documentedSuccess },
    ]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, now: () => now });

    await client.getCase("EAC9999103403");
    now = 1_700_000; // 28 min later: token (30 min) still valid
    await client.getCase("EAC9999103403");
    now = 1_760_000; // under a minute left: renew
    await client.getCase("EAC9999103403");

    expect(uscis.calls.filter((url) => url === config.tokenUrl)).toHaveLength(2);
  });

  it("renews the token once when USCIS rejects it", async () => {
    const uscis = fakeUscis([{ status: 401, body: { message: "Invalid token" } }, { status: 200, body: documentedSuccess }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch });

    const result = await client.getCase("EAC9999103403");

    expect(result.ok).toBe(true);
    expect(uscis.calls.filter((url) => url === config.tokenUrl)).toHaveLength(2);
  });

  it("retries a server error once", async () => {
    const uscis = fakeUscis([{ status: 502, body: null }, { status: 200, body: documentedSuccess }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    expect((await client.getCase("EAC9999103403")).ok).toBe(true);
    expect(uscis.caseCalls()).toHaveLength(2);
  });

  it("gives up after the retry and reports the error", async () => {
    const uscis = fakeUscis([{ status: 502, body: null }, { status: 502, body: null }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    const result = await client.getCase("EAC9999103403");

    expect(result).toMatchObject({ ok: false, error: { code: "unavailable" }, httpStatus: 502 });
    expect(uscis.caseCalls()).toHaveLength(2);
  });

  it("does not retry when the sandbox is closed for the day", async () => {
    const uscis = fakeUscis([{ status: 503, body: sandboxClosed }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    const result = await client.getCase("EAC9999103403");

    expect(result).toMatchObject({ ok: false, error: { code: "unavailable", outsideHours: true } });
    expect(uscis.caseCalls()).toHaveLength(1);
  });

  it("does not retry a receipt USCIS does not know", async () => {
    const uscis = fakeUscis([{ status: 404, body: { message: "Not found" } }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    expect(await client.getCase("EAC9999103499")).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(uscis.caseCalls()).toHaveLength(1);
  });

  it("times out a request that hangs", async () => {
    const uscis = fakeUscis(["hang", "hang"]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, timeoutMs: 20, sleep: async () => {} });

    expect(await client.getCase("EAC9999103403")).toMatchObject({ ok: false, error: { code: "timeout" }, httpStatus: null });
  });

  it("reports a network failure as unavailable", async () => {
    const uscis = fakeUscis(["network-error", "network-error"]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    expect(await client.getCase("EAC9999103403")).toMatchObject({ ok: false, error: { code: "unavailable" }, httpStatus: null });
  });

  it("reports a rejected token request as an authentication failure", async () => {
    const uscis = fakeUscis([], [{ status: 401, body: { error: "invalid_client" } }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch, sleep: async () => {} });

    expect(await client.getCase("EAC9999103403")).toMatchObject({ ok: false, error: { code: "auth_failed" } });
    expect(uscis.caseCalls()).toHaveLength(0);
  });

  it("reports a success response it cannot read as unexpected", async () => {
    const uscis = fakeUscis([{ status: 200, body: { unexpected: true } }]);
    const client = createUscisClient({ ...config, fetch: uscis.fetch });

    expect(await client.getCase("EAC9999103403")).toMatchObject({ ok: false, error: { code: "unexpected_response" } });
  });
});
