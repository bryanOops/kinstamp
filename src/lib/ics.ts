/**
 * Minimal RFC 5545 builder for one key date. Pure and framework-free so it is unit-tested.
 * All-day events use a DATE value; timed events are expressed in the given IANA time zone.
 */
export type IcsEvent = {
  uid: string;
  title: string;
  description?: string | null;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM`, local to `timeZone`; omitted for all-day events. */
  time?: string | null;
  timeZone?: string;
  /** Minutes the timed event lasts. */
  durationMinutes?: number;
  /** Stamp used for DTSTAMP, defaults to the Unix epoch so output is reproducible in tests. */
  stamp?: Date;
  url?: string | null;
};

const CRLF = "\r\n";

/** Escapes text per RFC 5545 §3.3.11. */
export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds lines longer than 75 octets per RFC 5545 §3.1. */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let chunk = "";
  let chunkBytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char, "utf8");
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (chunkBytes + size > limit) {
      parts.push(chunk);
      chunk = "";
      chunkBytes = 0;
    }
    chunk += char;
    chunkBytes += size;
  }
  parts.push(chunk);
  return parts.join(`${CRLF} `);
}

function compactDate(date: string): string {
  return date.replace(/-/g, "");
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function addMinutes(date: string, time: string, minutes: number): { date: string; time: string } {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const dayOffset = Math.floor(total / 1440);
  const within = ((total % 1440) + 1440) % 1440;
  const [y, mo, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d + dayOffset));
  return {
    date: next.toISOString().slice(0, 10),
    time: `${String(Math.floor(within / 60)).padStart(2, "0")}:${String(within % 60).padStart(2, "0")}`,
  };
}

export function buildIcsEvent(event: IcsEvent): string {
  const timeZone = event.timeZone ?? "America/New_York";
  const stamp = utcStamp(event.stamp ?? new Date(0));
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kinstamp//Key dates//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT"];
  lines.push(`UID:${event.uid}`, `DTSTAMP:${stamp}`);

  if (event.time) {
    const end = addMinutes(event.date, event.time, event.durationMinutes ?? 60);
    lines.push(
      `DTSTART;TZID=${timeZone}:${compactDate(event.date)}T${event.time.replace(":", "")}00`,
      `DTEND;TZID=${timeZone}:${compactDate(end.date)}T${end.time.replace(":", "")}00`,
    );
  } else {
    const nextDay = addMinutes(event.date, "00:00", 1440).date;
    lines.push(`DTSTART;VALUE=DATE:${compactDate(event.date)}`, `DTEND;VALUE=DATE:${compactDate(nextDay)}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
