import { easternOffsetMinutes } from "@/lib/time";

/**
 * "Add to calendar" links that open Google Calendar or Outlook with the event prefilled, so a
 * key date lands in the person's calendar in one click. Apple Calendar and others use the .ics
 * route. Times on USCIS notices are Eastern; timed events last one hour.
 */
export type CalendarLinkEvent = {
  title: string;
  notes: string | null;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` in Eastern time, or null for an all-day event. */
  time: string | null;
};

const DURATION_MINUTES = 60;

function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The UTC instant of an Eastern wall-clock time. */
function easternToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hours, minutes);
  return new Date(asUtc - easternOffsetMinutes(new Date(asUtc)) * 60_000);
}

function compact(date: string): string {
  return date.replace(/-/g, "");
}

export function googleCalendarUrl(event: CalendarLinkEvent): string {
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title });
  if (event.time) {
    const start = `${compact(event.date)}T${event.time.replace(":", "")}00`;
    const end = new Date(Date.UTC(2000, 0, 1, ...(event.time.split(":").map(Number) as [number, number])) + DURATION_MINUTES * 60_000);
    // Google reads local times with `ctz`; an appointment does not cross midnight in practice,
    // but compute the end date from the start to be safe.
    const endDate = end.getUTCDate() === 1 ? event.date : nextDay(event.date);
    const endTime = `${String(end.getUTCHours()).padStart(2, "0")}${String(end.getUTCMinutes()).padStart(2, "0")}00`;
    params.set("dates", `${start}/${compact(endDate)}T${endTime}`);
    params.set("ctz", "America/New_York");
  } else {
    params.set("dates", `${compact(event.date)}/${compact(nextDay(event.date))}`);
  }
  if (event.notes) params.set("details", event.notes);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(event: CalendarLinkEvent): string {
  const params = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: event.title });
  if (event.time) {
    const start = easternToUtc(event.date, event.time);
    const end = new Date(start.getTime() + DURATION_MINUTES * 60_000);
    params.set("startdt", start.toISOString().replace(/\.\d{3}Z$/, "Z"));
    params.set("enddt", end.toISOString().replace(/\.\d{3}Z$/, "Z"));
  } else {
    params.set("allday", "true");
    params.set("startdt", event.date);
    params.set("enddt", nextDay(event.date));
  }
  if (event.notes) params.set("body", event.notes);
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}
