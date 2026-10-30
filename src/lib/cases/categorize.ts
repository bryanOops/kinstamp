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

/**
 * Ordered rules: the first match wins, so more specific wording comes first
 * (a "response to a request for evidence was received" is not a plain "received").
 */
const rules: [RegExp, StatusCategory][] = [
  [/response to .*request for (additional )?evidence|evidence was received/, "evidence_received"],
  [/request for (additional )?evidence|requested? .*evidence/, "evidence_requested"],
  [/fingerprint|biometric/, "biometrics"],
  [/interview/, "interview"],
  [/withdraw/, "withdrawn"],
  [/denied|rejected|\bdeny\b/, "denied"],
  [/card .*(mailed|delivered)|(mailed|delivered) .*card/, "card_delivered"],
  [/card .*produced|producing .*card/, "card_produced"],
  [/transferred/, "transferred"],
  [/approved/, "approved"],
  [/received/, "received"],
];

/** Maps a USCIS status title or history sentence to a category used for colors, explanations and insights. */
export function categorizeStatus(text: string): StatusCategory {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  return rules.find(([pattern]) => pattern.test(normalized))?.[1] ?? "other";
}
