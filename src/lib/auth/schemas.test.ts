import { describe, expect, it } from "vitest";
import { safeNextPath, signInReason, signInSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  const valid = {
    fullName: " Maria Lopez ",
    email: " Maria@Example.COM ",
    password: "correct-horse",
    role: "client",
    insightsConsent: false,
  };

  it("normalizes name and email", () => {
    const result = signUpSchema.parse(valid);
    expect(result.fullName).toBe("Maria Lopez");
    expect(result.email).toBe("maria@example.com");
  });

  it.each([
    [{ fullName: "  " }, "nameRequired"],
    [{ email: "not-an-email" }, "invalidEmail"],
    [{ password: "short" }, "passwordTooShort"],
    [{ role: "admin" }, "roleRequired"],
  ])("rejects %o with %s", (override, message) => {
    const result = signUpSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe("signInSchema", () => {
  it("requires a password", () => {
    const result = signInSchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.error?.issues[0]?.message).toBe("passwordRequired");
  });
});

describe("safeNextPath", () => {
  it.each(["/cases", "/cases/123?tab=history"])("allows %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "cases", undefined])("rejects %s", (path) => {
    expect(safeNextPath(path)).toBeNull();
  });
});

describe("signInReason", () => {
  it.each(["idle", "expired"] as const)("accepts %s", (reason) => {
    expect(signInReason(reason)).toBe(reason);
  });

  it.each(["other", ["idle"], undefined, 42])("ignores %s", (value) => {
    expect(signInReason(value)).toBeNull();
  });
});
