import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  groupKeyDatesByDay,
  initialCalendarMonth,
  keyDatesInMonth,
  monthMatrix,
  monthOf,
  nextMonthWithKeyDates,
  previewSummary,
  summarizeKinds,
  toDateKey,
  weekdayOrder,
  weekStartFor,
} from "./key-dates-calendar";

// Friday Oct 30, 2026 at noon UTC.
const now = new Date("2026-10-30T12:00:00Z");

const kd = (id: string, date: string, kind: "due_date" | "appointment" = "due_date", time: string | null = null) => ({ id, date, time, kind });

describe("weekStartFor", () => {
  it("starts the week on Sunday for English and on Monday for Spanish", () => {
    expect(weekStartFor("en")).toBe(0);
    expect(weekStartFor("es")).toBe(1);
    expect(weekStartFor("es-MX")).toBe(1);
  });
});

describe("weekdayOrder", () => {
  it("lists the JS weekday indices starting from the week start", () => {
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe("monthMatrix", () => {
  // Nov 1, 2026 is a Sunday.
  it("builds six rows of seven days starting on the week start, Sunday-first", () => {
    const rows = monthMatrix("2026-11", 0);
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(rows[0][0]).toEqual({ date: "2026-11-01", inMonth: true });
    expect(rows[5][6]).toEqual({ date: "2026-12-12", inMonth: false });
  });

  it("pads the first row with the previous month when the week starts on Monday", () => {
    const rows = monthMatrix("2026-11", 1);
    expect(rows[0].map((day) => day.date)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(rows[0].slice(0, 6).every((day) => !day.inMonth)).toBe(true);
    expect(rows[0][6].inMonth).toBe(true);
    expect(rows[5][6].date).toBe("2026-12-06");
  });

  it("always returns six rows so the grid keeps its height across months", () => {
    // Feb 2026 starts on a Sunday and fits exactly four Sunday-first rows.
    const rows = monthMatrix("2026-02", 0);
    expect(rows).toHaveLength(6);
    expect(rows[0][0].date).toBe("2026-02-01");
    expect(rows[3][6].date).toBe("2026-02-28");
    expect(rows[4][0]).toEqual({ date: "2026-03-01", inMonth: false });
  });
});

describe("month and day arithmetic", () => {
  it("derives the month of a date", () => {
    expect(monthOf("2026-11-03")).toBe("2026-11");
  });

  it("adds months across year boundaries", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", 0)).toBe("2026-10");
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-03", 7)).toBe("2026-11-10");
  });

  it("keys an instant by its UTC calendar day", () => {
    expect(toDateKey(now)).toBe("2026-10-30");
    expect(toDateKey(new Date("2026-10-30T23:59:00Z"))).toBe("2026-10-30");
  });
});

describe("groupKeyDatesByDay", () => {
  it("groups by date and orders a day's entries all-day first, then by time", () => {
    const byDay = groupKeyDatesByDay([kd("late", "2026-11-03", "appointment", "14:00:00"), kd("other", "2026-11-20"), kd("allDay", "2026-11-03"), kd("early", "2026-11-03", "appointment", "09:30:00")]);
    expect([...byDay.keys()]).toEqual(["2026-11-03", "2026-11-20"]);
    expect(byDay.get("2026-11-03")?.map((k) => k.id)).toEqual(["allDay", "early", "late"]);
  });
});

describe("keyDatesInMonth", () => {
  it("keeps only the visible month's dates, soonest first", () => {
    const inMonth = keyDatesInMonth([kd("dec", "2026-12-01"), kd("nov20", "2026-11-20"), kd("nov3", "2026-11-03"), kd("oct", "2026-10-31")], "2026-11");
    expect(inMonth.map((k) => k.id)).toEqual(["nov3", "nov20"]);
  });
});

describe("summarizeKinds", () => {
  it("counts due dates and appointments", () => {
    expect(summarizeKinds([kd("a", "2026-11-03"), kd("b", "2026-11-05", "appointment"), kd("c", "2026-11-09")])).toEqual({ total: 3, dueDates: 2, appointments: 1 });
    expect(summarizeKinds([])).toEqual({ total: 0, dueDates: 0, appointments: 0 });
  });
});

describe("nextMonthWithKeyDates", () => {
  const dates = [kd("nov", "2026-11-03"), kd("jan", "2027-01-10"), kd("sep", "2026-09-01")];

  it("finds the first later month that has a key date", () => {
    expect(nextMonthWithKeyDates(dates, "2026-11")).toBe("2027-01");
    expect(nextMonthWithKeyDates(dates, "2026-10")).toBe("2026-11");
  });

  it("returns null when no later month has one", () => {
    expect(nextMonthWithKeyDates(dates, "2027-01")).toBeNull();
    expect(nextMonthWithKeyDates([], "2026-11")).toBeNull();
  });
});

describe("initialCalendarMonth", () => {
  it("opens on the month of the next upcoming key date", () => {
    expect(initialCalendarMonth([kd("past", "2026-09-15"), kd("later", "2027-01-10"), kd("next", "2026-12-04")], now)).toBe("2026-12");
  });

  it("counts today as upcoming", () => {
    expect(initialCalendarMonth([kd("today", "2026-10-30"), kd("later", "2026-12-04")], now)).toBe("2026-10");
  });

  it("falls back to the current month when nothing is upcoming", () => {
    expect(initialCalendarMonth([kd("past", "2026-09-15")], now)).toBe("2026-10");
    expect(initialCalendarMonth([], now)).toBe("2026-10");
  });
});

describe("previewSummary", () => {
  it("counts what is still to come this month and the days until the next key date", () => {
    expect(previewSummary([kd("past", "2026-10-20"), kd("tomorrow", "2026-10-31"), kd("nov", "2026-11-03")], now)).toEqual({ thisMonth: 1, nextInDays: 1 });
  });

  it("reports zero this month and the distance to a later month", () => {
    expect(previewSummary([kd("nov", "2026-11-03")], now)).toEqual({ thisMonth: 0, nextInDays: 4 });
  });

  it("has no next date when nothing is upcoming", () => {
    expect(previewSummary([kd("past", "2026-10-20")], now)).toEqual({ thisMonth: 0, nextInDays: null });
  });
});
