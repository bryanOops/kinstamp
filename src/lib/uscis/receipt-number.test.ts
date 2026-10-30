import { describe, expect, it } from "vitest";
import { parseReceiptNumber } from "./receipt-number";

describe("parseReceiptNumber", () => {
  it("accepts a well-formed receipt number", () => {
    expect(parseReceiptNumber("EAC9999103403")).toEqual({ ok: true, value: "EAC9999103403" });
  });

  it.each([" eac9999103403 ", "EAC-999-910-3403", "EAC 999 910 3403", "eac999\t9103403"])(
    "normalizes how people type it: %j",
    (input) => {
      expect(parseReceiptNumber(input)).toEqual({ ok: true, value: "EAC9999103403" });
    },
  );

  it.each([
    ["empty", ""],
    ["too short", "EAC999910340"],
    ["too long", "EAC99991034030"],
    ["digits where letters go", "1AC9999103403"],
    ["letters where digits go", "EAC99991034O3"],
    ["accented letters", "ÉAC9999103403"],
    ["other symbols", "EAC9999103403!"],
  ])("rejects %s", (_label, input) => {
    expect(parseReceiptNumber(input)).toEqual({ ok: false, error: "invalid_receipt" });
  });
});
