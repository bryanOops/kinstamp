import type { CaseSnapshot } from "@/lib/uscis/parse-response";
import { easternDate } from "@/lib/time";
import { categorizeStatus, type StatusCategory } from "./categorize";

/** The part of an already saved status event that matters to decide what is new. */
export type StoredEvent = {
  origin: "reported" | "observed";
  occurredOn: string;
  textEn: string;
};

export type NewStatusEvent = {
  origin: "reported" | "observed";
  /** `YYYY-MM-DD`. */
  occurredOn: string;
  observedAt: string | null;
  textEn: string;
  textEs: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  category: StatusCategory;
};

export type CheckOutcome = {
  /** True when the status differs from the last one Kinstamp observed. The first check is never a change. */
  changed: boolean;
  /** Status events to append, in chronological order. */
  newEvents: NewStatusEvent[];
};

/**
 * Given a case's saved status events (chronological) and a fresh USCIS response,
 * decides which status events to append (ADR 0002).
 */
export function applyCheck(previous: StoredEvent[], snapshot: CaseSnapshot, now: Date): CheckOutcome {
  const lastObserved = previous.filter((event) => event.origin === "observed").at(-1);
  const statusChanged = !lastObserved || normalize(lastObserved.textEn) !== normalize(snapshot.status.en);

  const observed: NewStatusEvent[] = statusChanged
    ? [
        {
          origin: "observed",
          occurredOn: easternDate(now),
          observedAt: now.toISOString(),
          textEn: snapshot.status.en,
          textEs: snapshot.status.es,
          descriptionEn: snapshot.description.en,
          descriptionEs: snapshot.description.es,
          category: categorizeStatus(snapshot.status.en),
        },
      ]
    : [];

  return { changed: Boolean(lastObserved) && statusChanged, newEvents: [...newReported(previous, snapshot), ...observed] };
}

/** USCIS history entries not saved yet, oldest first, without duplicates. */
function newReported(previous: StoredEvent[], snapshot: CaseSnapshot): NewStatusEvent[] {
  const key = (date: string, text: string) => `${date}|${normalize(text)}`;
  const seen = new Set(previous.filter((e) => e.origin === "reported").map((e) => key(e.occurredOn, e.textEn)));

  return [...snapshot.history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((entry) => {
      const entryKey = key(entry.date, entry.en);
      if (seen.has(entryKey)) return false;
      seen.add(entryKey);
      return true;
    })
    .map((entry) => ({
      origin: "reported",
      occurredOn: entry.date,
      observedAt: null,
      textEn: entry.en,
      textEs: entry.es,
      descriptionEn: null,
      descriptionEs: null,
      category: categorizeStatus(entry.en),
    }));
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

