/** What the attorney dashboard knows about one shared case to decide whether it needs review. */
export type ReviewInput = {
  /** When Kinstamp recorded the newest status event of the case (any origin), or null without events. */
  lastEventAt: string | null;
  /** When this attorney last marked the case as reviewed, or null if never. */
  reviewedAt: string | null;
  /** When the active share to this attorney was created. */
  sharedAt: string;
};

/**
 * A shared case needs review when a status event was recorded after the attorney last marked it as
 * reviewed, or, if they never did, after the case was shared with them.
 */
export function needsReview({ lastEventAt, reviewedAt, sharedAt }: ReviewInput): boolean {
  if (!lastEventAt) return false;
  // Instants, not strings: Postgres and JavaScript write the same moment differently.
  return Date.parse(lastEventAt) > Date.parse(reviewedAt ?? sharedAt);
}
