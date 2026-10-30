import { describe, expect, it } from "vitest";
import { daysUntil, urgencyFor } from "./days";

describe("daysUntil", () => {
  const now = new Date("2026-10-30T22:15:00Z");

  it("counts whole days regardless of the hour", () => {
    expect(daysUntil("2026-10-30", now)).toBe(0);
    expect(daysUntil("2026-10-31", now)).toBe(1);
    expect(daysUntil("2026-11-18", now)).toBe(19);
  });

  it("is negative for past dates", () => {
    expect(daysUntil("2026-10-27", now)).toBe(-3);
  });
});

describe("urgencyFor", () => {
  it("classifies by distance", () => {
    expect(urgencyFor(-1)).toBe("past");
    expect(urgencyFor(0)).toBe("today");
    expect(urgencyFor(7)).toBe("soon");
    expect(urgencyFor(8)).toBe("later");
  });
});
