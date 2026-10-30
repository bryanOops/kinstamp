const USCIS_TIME_ZONE = "America/New_York";

/** Minutes between UTC and New York at the given instant (e.g. -240 in summer). */
export function easternOffsetMinutes(at: Date): number {
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: USCIS_TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

/** Calendar date (`YYYY-MM-DD`) in New York, where USCIS operates. */
export function easternDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: USCIS_TIME_ZONE }).format(at);
}

/** The instant the current New York day started; USCIS quotas reset then. */
export function easternDayStart(at: Date): Date {
  const [year, month, day] = easternDate(at).split("-").map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  return new Date(midnightAsUtc - easternOffsetMinutes(new Date(midnightAsUtc + 12 * 3_600_000)) * 60_000);
}
