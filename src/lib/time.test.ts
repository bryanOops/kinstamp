import { describe, expect, it } from "vitest";
import { easternDate, easternDayStart } from "./time";

describe("easternDayStart", () => {
  it("is midnight in New York during daylight saving time", () => {
    expect(easternDayStart(new Date("2026-10-30T15:00:00Z")).toISOString()).toBe("2026-10-30T04:00:00.000Z");
  });

  it("is midnight in New York in winter", () => {
    expect(easternDayStart(new Date("2026-12-01T15:00:00Z")).toISOString()).toBe("2026-12-01T05:00:00.000Z");
  });

  it("uses the New York day, not the UTC day, late at night", () => {
    expect(easternDate(new Date("2026-10-31T02:30:00Z"))).toBe("2026-10-30");
  });
});
