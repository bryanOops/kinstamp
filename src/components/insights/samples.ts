import type { InsightSummary } from "@/components/cases/types";

export const sampleInsights: InsightSummary[] = [
  { formType: "I-130", count: 61, medianDays: 352, p25Days: 290, p75Days: 430 },
  { formType: "I-485", count: 27, medianDays: 410, p25Days: 320, p75Days: 540 },
  { formType: "I-765", count: 48, medianDays: 118, p25Days: 76, p75Days: 162 },
  { formType: "I-131", count: 12, medianDays: 140, p25Days: 95, p75Days: 210 },
];

/** The signed-in client's own cases, to mark "your case" on the chart. */
export const sampleOwnCases = [
  { trackedCaseId: "tc_1", nickname: "Mom's green card", formType: "I-130", receivedOn: "2025-11-12" },
  { trackedCaseId: "tc_2", nickname: "Work permit", formType: "I-765", receivedOn: "2026-03-30" },
];
