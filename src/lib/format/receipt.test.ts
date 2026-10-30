import { describe, expect, it } from "vitest";
import { groupReceiptNumber, isReceiptNumber, normalizeReceiptNumber } from "./receipt";

describe("groupReceiptNumber", () => {
  it("groups a valid receipt in 3-3-3-4", () => {
    expect(groupReceiptNumber("EAC9999103403")).toBe("EAC 999 910 3403");
  });

  it("normalizes spaces, dashes and case before grouping", () => {
    expect(groupReceiptNumber(" eac-999 910-3403 ")).toBe("EAC 999 910 3403");
  });

  it("returns the normalized value when it is not a receipt number", () => {
    expect(groupReceiptNumber("abc")).toBe("ABC");
  });
});

describe("normalizeReceiptNumber / isReceiptNumber", () => {
  it("accepts three letters and ten digits", () => {
    expect(normalizeReceiptNumber("lin 9999 106 498")).toBe("LIN9999106498");
    expect(isReceiptNumber("lin 9999 106 498")).toBe(true);
  });

  it("rejects wrong lengths and characters", () => {
    expect(isReceiptNumber("EAC99991034")).toBe(false);
    expect(isReceiptNumber("EA99999103403")).toBe(false);
    expect(isReceiptNumber("")).toBe(false);
  });
});
