import type { TimelineEvent } from "@/components/status/timeline";
import type { KeyDateKind } from "@/components/status/key-date-chip";
import type { OfficialProcessingTime } from "@/lib/processing-times/official";

export type { OfficialProcessingTime };

/** Localized pair as stored for USCIS texts (`status_en` / `status_es`). */
export type Bilingual = { en: string; es: string | null };

export type CheckState = "awaiting_first_check" | "ok" | "error";

/** One row of the client dashboard: a tracked case with its case's latest status. */
export type TrackedCaseSummary = {
  trackedCaseId: string;
  receiptNumber: string;
  nickname: string | null;
  formType: string | null;
  status: Bilingual | null;
  statusCategory: string | null;
  checkState: CheckState;
  /** `YYYY-MM-DD` of the newest status event, if any. */
  lastChangeOn: string | null;
  lastSuccessfulCheckAt: string | null;
  /** True when a status event was observed after the client last viewed the case. */
  changedSinceLastVisit: boolean;
  nextKeyDate: NextKeyDate | null;
};

/** The soonest key date; kind and title are unknown on screens that only load the date. */
export type NextKeyDate = { date: string; kind?: KeyDateKind; title?: string };

export type ShareStatus = "active" | "pending" | "revoked";

export type Share = {
  id: string;
  attorneyEmail: string;
  status: ShareStatus;
  createdAt: string;
  revokedAt: string | null;
};

export type KeyDate = {
  id: string;
  kind: KeyDateKind;
  date: string;
  time: string | null;
  title: string;
  notes: string | null;
  /** Whether the current person may delete it (creator or the client who owns the case). */
  canDelete: boolean;
};

export type InsightSummary = {
  formType: string;
  count: number;
  medianDays: number;
  p25Days: number;
  p75Days: number;
};

export type CaseDetail = {
  trackedCaseId: string;
  receiptNumber: string;
  nickname: string | null;
  formType: string | null;
  formTitle: Bilingual | null;
  status: Bilingual | null;
  description: Bilingual | null;
  statusCategory: string | null;
  checkState: CheckState;
  /** `YYYY-MM-DD` of the first received event (or the USCIS submitted date), used for the case age. */
  receivedOn: string | null;
  lastChangeOn: string | null;
  lastSuccessfulCheckAt: string | null;
  lastErrorCode: string | null;
  events: TimelineEvent[];
  keyDates: KeyDate[];
  shares: Share[];
  officialProcessingTime: OfficialProcessingTime | null;
  insight: InsightSummary | null;
};
