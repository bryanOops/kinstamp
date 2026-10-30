import { describe, expect, it } from "vitest";
import { buildIcsEvent, escapeIcsText, foldIcsLine } from "./ics";

describe("buildIcsEvent", () => {
  it("builds an all-day event with an exclusive DTEND", () => {
    const ics = buildIcsEvent({ uid: "kd_1@kinstamp", title: "RFE response due", date: "2026-11-18" });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261118\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261119\r\n");
    expect(ics).toContain("SUMMARY:RFE response due\r\n");
    expect(ics).toContain("DTSTAMP:19700101T000000Z\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("builds a timed event in Eastern time lasting an hour", () => {
    const ics = buildIcsEvent({ uid: "kd_2@kinstamp", title: "Biometrics", date: "2026-12-04", time: "09:30" });
    expect(ics).toContain("DTSTART;TZID=America/New_York:20261204T093000\r\n");
    expect(ics).toContain("DTEND;TZID=America/New_York:20261204T103000\r\n");
  });

  it("rolls a late event into the next day", () => {
    const ics = buildIcsEvent({ uid: "x", title: "Late", date: "2026-12-31", time: "23:30", durationMinutes: 60 });
    expect(ics).toContain("DTEND;TZID=America/New_York:20270101T003000\r\n");
  });

  it("escapes commas, semicolons and newlines in text", () => {
    expect(escapeIcsText("Bring: passport, I-797; notes\nline 2")).toBe("Bring: passport\\, I-797\\; notes\\nline 2");
  });

  it("folds long lines at 75 octets with a leading space", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"a".repeat(100)}`);
    const [first, second] = folded.split("\r\n");
    expect(Buffer.byteLength(first)).toBe(75);
    expect(second.startsWith(" ")).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"a".repeat(100)}`);
  });
});
