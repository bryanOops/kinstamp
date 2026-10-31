import type { Bilingual, CheckState, NextKeyDate } from "@/components/cases/types";

/** One private attorney note on a shared case, as the notes card and the notes view render it. */
export type AttorneyNote = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  /** Shown before the server confirms it (optimistic add). */
  pending?: boolean;
};

/** One row of the attorney dashboard: a share plus its tracked case and case. */
export type SharedCaseRow = {
  shareId: string;
  trackedCaseId: string;
  clientName: string;
  nickname: string | null;
  receiptNumber: string;
  formType: string | null;
  status: Bilingual | null;
  statusCategory: string | null;
  checkState: CheckState;
  /** `YYYY-MM-DD` of the newest status event. */
  lastChangeOn: string | null;
  lastSuccessfulCheckAt: string | null;
  nextKeyDate: NextKeyDate | null;
  /** A status event was recorded after the attorney last marked the case as reviewed (src/lib/attorney/review.ts). */
  needsReview: boolean;
};
