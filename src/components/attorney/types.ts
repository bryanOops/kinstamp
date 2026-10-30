import type { Bilingual, CheckState } from "@/components/cases/types";
import type { KeyDateKind } from "@/components/status/key-date-chip";

/** One row of the attorney dashboard: a share plus its tracked case and case. */
export type SharedCaseRow = {
  shareId: string;
  clientName: string;
  nickname: string | null;
  receiptNumber: string;
  formType: string | null;
  status: Bilingual | null;
  statusCategory: string | null;
  checkState: CheckState;
  lastChangeAt: string | null;
  lastSuccessfulCheckAt: string | null;
  nextKeyDate: { kind: KeyDateKind; date: string; title: string } | null;
};
