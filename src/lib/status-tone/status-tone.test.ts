import { describe, expect, it } from "vitest";
import { toneFor } from "./status-tone";

describe("toneFor", () => {
  it("maps approval-like categories to approved", () => {
    expect(toneFor("approved")).toBe("approved");
    expect(toneFor("card_produced")).toBe("approved");
    expect(toneFor("card_delivered")).toBe("approved");
  });

  it("flags a request for evidence as action needed", () => {
    expect(toneFor("evidence_requested")).toBe("action");
  });

  it("treats denied and withdrawn as denied", () => {
    expect(toneFor("denied")).toBe("denied");
    expect(toneFor("withdrawn")).toBe("denied");
  });

  it("falls back to unknown for missing or unexpected categories", () => {
    expect(toneFor(null)).toBe("unknown");
    expect(toneFor(undefined)).toBe("unknown");
    expect(toneFor("something_else")).toBe("unknown");
    expect(toneFor("other")).toBe("unknown");
  });
});
