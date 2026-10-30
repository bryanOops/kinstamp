import { describe, expect, it } from "vitest";
import sandboxClosed from "./__fixtures__/sandbox-closed-503.json";
import { classifyUscisError } from "./classify-error";

describe("classifyUscisError", () => {
  it("recognizes the sandbox being closed outside business hours (recorded response)", () => {
    expect(classifyUscisError(503, sandboxClosed)).toEqual({
      code: "unavailable",
      outsideHours: true,
      retryable: false,
      message: sandboxClosed.error.message,
    });
  });

  it.each([
    [400, "invalid_receipt", false],
    [404, "not_found", false],
    [401, "auth_failed", true],
    [403, "auth_failed", false],
    [429, "rate_limited", true],
    [500, "unavailable", true],
    [502, "unavailable", true],
    [503, "unavailable", true],
    [504, "unavailable", true],
    [418, "unknown", false],
  ] as const)("maps HTTP %i to %s (retryable: %s)", (status, code, retryable) => {
    const result = classifyUscisError(status, { message: "Something happened" });
    expect(result).toMatchObject({ code, retryable, outsideHours: false });
  });

  it.each([
    ["the documented shape", { message: "Receipt number is invalid" }],
    ["the nested shape", { error: { code: "400", message: "Receipt number is invalid" } }],
    [
      "the RFC 9457 shape",
      { code: "E-400", message: "Receipt number is invalid", category: "x", reference: "y", status: 400, traceId: "z" },
    ],
  ])("keeps the USCIS message from %s", (_label, body) => {
    expect(classifyUscisError(400, body).message).toBe("Receipt number is invalid");
  });

  it.each([
    ["no body", null],
    ["an HTML page", "<html>Bad gateway</html>"],
    ["a message that is not text", { message: 42 }],
  ])("copes with %s", (_label, body) => {
    expect(classifyUscisError(502, body)).toMatchObject({ code: "unavailable", message: null });
  });
});
