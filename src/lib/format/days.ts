const DAY_MS = 86_400_000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Whole days from `now` to a calendar date (`YYYY-MM-DD`). Negative when the date is in the past.
 * Both sides are compared at UTC midnight so the hour of day never shifts the count.
 */
export function daysUntil(date: string, now: Date): number {
  const [y, m, d] = date.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - startOfUtcDay(now)) / DAY_MS);
}

export type Urgency = "past" | "today" | "soon" | "later";

/** `soon` is within the next 7 days: the window in which a due date needs attention. */
export function urgencyFor(days: number): Urgency {
  if (days < 0) return "past";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "later";
}
