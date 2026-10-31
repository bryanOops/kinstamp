import { daysUntil } from "@/lib/format/days";

/** Upcoming rows shown before the "Show all" toggle. Four keeps the card about one screen tall on a phone. */
export const UPCOMING_PREVIEW = 4;

type Dated = { date: string; time: string | null };

/** Same day: all-day entries first, then by time. */
function compareDated(a: Dated, b: Dated): number {
  return a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");
}

/**
 * Splits key dates for the card: `upcoming` (today or later) soonest first, `past` most recent
 * first. "Today" counts as upcoming for the whole day, whatever the hour, so a morning
 * appointment does not fall into the past section at lunch.
 */
export function groupKeyDates<T extends Dated>(keyDates: readonly T[], now: Date): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const keyDate of keyDates) (daysUntil(keyDate.date, now) < 0 ? past : upcoming).push(keyDate);
  upcoming.sort(compareDated);
  past.sort((a, b) => compareDated(b, a));
  return { upcoming, past };
}
