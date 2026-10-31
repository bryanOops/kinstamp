import { daysUntil } from "@/lib/format/days";

/** JS weekday index the calendar week starts on: 0 = Sunday (en), 1 = Monday (es). */
export type WeekStart = 0 | 1;

/** One cell of the month grid. `inMonth` is false for the padding days of the neighbouring months. */
export type CalendarDay = { date: string; inMonth: boolean };

type Dated = { date: string; time: string | null };
type Kinded = { kind: "due_date" | "appointment" };

/** Rows the grid always has, so its height never changes while flipping months. */
const WEEKS_PER_MONTH = 6;
const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateKeyOf(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function utcMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Same day: all-day entries first, then by time. */
function compareDated(a: Dated, b: Dated): number {
  return a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");
}

/** Spanish calendars start on Monday; English ones on Sunday. */
export function weekStartFor(locale: string): WeekStart {
  return locale.toLowerCase().startsWith("es") ? 1 : 0;
}

/** JS weekday indices in column order, for the grid headers. */
export function weekdayOrder(weekStart: WeekStart): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
}

/** `YYYY-MM-DD` of an instant's UTC calendar day: the same "today" `daysUntil` uses. */
export function toDateKey(now: Date): string {
  return dateKeyOf(now.getTime());
}

/** `YYYY-MM` of a `YYYY-MM-DD`. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function addDays(date: string, delta: number): string {
  return dateKeyOf(utcMs(date) + delta * DAY_MS);
}

/**
 * The six-week grid of a month: rows of seven days starting on `weekStart`, padded with the
 * neighbouring months so the first row begins on the week start and every month is six rows tall.
 */
export function monthMatrix(month: string, weekStart: WeekStart): CalendarDay[][] {
  const first = utcMs(`${month}-01`);
  const offset = (new Date(first).getUTCDay() - weekStart + 7) % 7;
  const start = first - offset * DAY_MS;
  return Array.from({ length: WEEKS_PER_MONTH }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = dateKeyOf(start + (week * 7 + day) * DAY_MS);
      return { date, inMonth: monthOf(date) === month };
    }),
  );
}

/** Key dates by `YYYY-MM-DD`, in date order; a day's entries all-day first, then by time. */
export function groupKeyDatesByDay<T extends Dated>(keyDates: readonly T[]): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const keyDate of [...keyDates].sort(compareDated)) {
    const list = byDay.get(keyDate.date);
    if (list) list.push(keyDate);
    else byDay.set(keyDate.date, [keyDate]);
  }
  return byDay;
}

/** The key dates of one `YYYY-MM`, soonest first. */
export function keyDatesInMonth<T extends Dated>(keyDates: readonly T[], month: string): T[] {
  return keyDates.filter((keyDate) => monthOf(keyDate.date) === month).sort(compareDated);
}

export type KindSummary = { total: number; dueDates: number; appointments: number };

export function summarizeKinds(keyDates: readonly Kinded[]): KindSummary {
  const dueDates = keyDates.filter((keyDate) => keyDate.kind === "due_date").length;
  return { total: keyDates.length, dueDates, appointments: keyDates.length - dueDates };
}

/** The first month after `month` that has a key date, or null. */
export function nextMonthWithKeyDates(keyDates: readonly Dated[], month: string): string | null {
  const later = keyDates.map((keyDate) => monthOf(keyDate.date)).filter((candidate) => candidate > month);
  return later.length > 0 ? later.sort()[0] : null;
}

/** The month the calendar opens on: that of the next upcoming key date (today counts), else the current one. */
export function initialCalendarMonth(keyDates: readonly Dated[], now: Date): string {
  const upcoming = keyDates.filter((keyDate) => daysUntil(keyDate.date, now) >= 0).sort(compareDated);
  return monthOf(upcoming[0]?.date ?? toDateKey(now));
}

export type PreviewSummary = {
  /** Upcoming key dates (today or later) left in the current month. */
  thisMonth: number;
  /** Whole days until the nearest upcoming key date; null when nothing is upcoming. */
  nextInDays: number | null;
};

/** The one-line summary under the card title: "2 this month · next in 3 days". */
export function previewSummary(keyDates: readonly Dated[], now: Date): PreviewSummary {
  const upcoming = keyDates.filter((keyDate) => daysUntil(keyDate.date, now) >= 0).sort(compareDated);
  const currentMonth = monthOf(toDateKey(now));
  return {
    thisMonth: upcoming.filter((keyDate) => monthOf(keyDate.date) === currentMonth).length,
    nextInDays: upcoming.length > 0 ? daysUntil(upcoming[0].date, now) : null,
  };
}
