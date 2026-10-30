/** Status categories as stored in `status_events.category` and `cases.status_category`. */
export const statusCategories = [
  "received",
  "biometrics",
  "interview",
  "evidence_requested",
  "evidence_received",
  "approved",
  "card_produced",
  "card_delivered",
  "transferred",
  "denied",
  "withdrawn",
  "other",
] as const;

export type StatusCategory = (typeof statusCategories)[number];

/** The five visual tones a status can take. Color is always paired with text. */
export type StatusTone = "progress" | "action" | "approved" | "denied" | "unknown";

const toneByCategory: Record<StatusCategory, StatusTone> = {
  received: "progress",
  biometrics: "progress",
  interview: "progress",
  evidence_requested: "action",
  evidence_received: "progress",
  approved: "approved",
  card_produced: "approved",
  card_delivered: "approved",
  transferred: "progress",
  denied: "denied",
  withdrawn: "denied",
  other: "unknown",
};

export function isStatusCategory(value: unknown): value is StatusCategory {
  return typeof value === "string" && (statusCategories as readonly string[]).includes(value);
}

/** Maps a category (possibly missing, when a case has not been checked yet) to its tone. */
export function toneFor(category: string | null | undefined): StatusTone {
  return isStatusCategory(category) ? toneByCategory[category] : "unknown";
}
