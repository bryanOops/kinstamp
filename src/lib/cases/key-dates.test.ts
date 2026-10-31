import { describe, expect, it } from "vitest";
import { groupKeyDates, UPCOMING_PREVIEW } from "./key-dates";

// Noon UTC on Oct 30, 2026: the hour must not shift which side of "today" a date lands on.
const now = new Date("2026-10-30T12:00:00Z");

const kd = (id: string, date: string, time: string | null = null) => ({ id, date, time });

describe("groupKeyDates", () => {
  it("puts today and later dates in `upcoming`, soonest first", () => {
    const { upcoming } = groupKeyDates([kd("later", "2026-12-04"), kd("today", "2026-10-30"), kd("soon", "2026-11-03")], now);
    expect(upcoming.map((k) => k.id)).toEqual(["today", "soon", "later"]);
  });

  it("puts earlier dates in `past`, most recent first", () => {
    const { past } = groupKeyDates([kd("old", "2026-01-15"), kd("yesterday", "2026-10-29"), kd("lastWeek", "2026-10-23")], now);
    expect(past.map((k) => k.id)).toEqual(["yesterday", "lastWeek", "old"]);
  });

  it("orders the same day by time, all-day entries first", () => {
    const { upcoming } = groupKeyDates([kd("late", "2026-11-03", "14:00:00"), kd("allDay", "2026-11-03"), kd("early", "2026-11-03", "09:30:00")], now);
    expect(upcoming.map((k) => k.id)).toEqual(["allDay", "early", "late"]);
  });

  it("keeps a key date in `upcoming` for the whole of its day, whatever the hour", () => {
    const lateEvening = new Date("2026-10-30T23:59:00Z");
    expect(groupKeyDates([kd("today", "2026-10-30", "08:00:00")], lateEvening).upcoming).toHaveLength(1);
  });

  it("handles an empty list", () => {
    expect(groupKeyDates([], now)).toEqual({ upcoming: [], past: [] });
  });

  it("does not mutate the input", () => {
    const input = [kd("b", "2026-12-01"), kd("a", "2026-11-01")];
    groupKeyDates(input, now);
    expect(input.map((k) => k.id)).toEqual(["b", "a"]);
  });
});

describe("UPCOMING_PREVIEW", () => {
  it("shows four upcoming rows before the list asks to expand", () => {
    expect(UPCOMING_PREVIEW).toBe(4);
  });
});
