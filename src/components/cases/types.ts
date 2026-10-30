import type { TimelineEvent } from "@/components/status/timeline";
import type { KeyDateKind } from "@/components/status/key-date-chip";

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
  /** ISO instant of the newest status event, if any. */
  lastChangeAt: string | null;
  lastSuccessfulCheckAt: string | null;
  /** True when a status event was observed after the client last viewed the case. */
  changedSinceLastVisit: boolean;
  nextKeyDate: { kind: KeyDateKind; date: string; title: string } | null;
};

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

export type OfficialProcessingTime = {
  formType: string;
  minMonths: number;
  maxMonths: number;
  sourceUrl: string;
  /** `YYYY-MM-DD` when the figure was read from USCIS. */
  readOn: string;
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
  /** `YYYY-MM-DD` of the first received event, used for the case age. */
  receivedOn: string | null;
  lastChangeAt: string | null;
  lastSuccessfulCheckAt: string | null;
  lastErrorCode: string | null;
  events: TimelineEvent[];
  keyDates: KeyDate[];
  shares: Share[];
  officialProcessingTime: OfficialProcessingTime | null;
  insight: InsightSummary | null;
};

/** Outcome of a refresh, as the screen shows it. */
export type RefreshState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "recent"; checkedAt: string }
  | { kind: "unchanged"; since: string }
  | { kind: "changed"; newEventId: string }
  | { kind: "error"; code: string; lastSavedAt: string | null };
