import { describe, expect, it } from "vitest";
import { googleCalendarUrl, outlookCalendarUrl } from "./calendar-links";

const due = { title: "RFE response due", notes: "Send the employer letter", date: "2026-11-03", time: null };
const appointment = { title: "Biometrics appointment", notes: null, date: "2026-11-12", time: "09:30" };
const summerAppointment = { ...appointment, date: "2026-07-14" };

describe("googleCalendarUrl", () => {
  it("creates an all-day event that ends the next day (exclusive end)", () => {
    const url = new URL(googleCalendarUrl(due));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("RFE response due");
    expect(url.searchParams.get("dates")).toBe("20261103/20261104");
    expect(url.searchParams.get("details")).toBe("Send the employer letter");
  });

  it("creates a one-hour timed event in Eastern time", () => {
    const url = new URL(googleCalendarUrl(appointment));
    expect(url.searchParams.get("dates")).toBe("20261112T093000/20261112T103000");
    expect(url.searchParams.get("ctz")).toBe("America/New_York");
    expect(url.searchParams.has("details")).toBe(false);
  });
});

describe("outlookCalendarUrl", () => {
  it("creates an all-day event", () => {
    const url = new URL(outlookCalendarUrl(due));
    expect(url.origin + url.pathname).toBe("https://outlook.live.com/calendar/0/action/compose");
    expect(url.searchParams.get("subject")).toBe("RFE response due");
    expect(url.searchParams.get("allday")).toBe("true");
    expect(url.searchParams.get("startdt")).toBe("2026-11-03");
    expect(url.searchParams.get("enddt")).toBe("2026-11-04");
    expect(url.searchParams.get("body")).toBe("Send the employer letter");
  });

  it("converts a timed Eastern event to UTC, following daylight saving", () => {
    expect(new URL(outlookCalendarUrl(appointment)).searchParams.get("startdt")).toBe("2026-11-12T14:30:00Z");
    expect(new URL(outlookCalendarUrl(appointment)).searchParams.get("enddt")).toBe("2026-11-12T15:30:00Z");
    expect(new URL(outlookCalendarUrl(summerAppointment)).searchParams.get("startdt")).toBe("2026-07-14T13:30:00Z");
  });
});
