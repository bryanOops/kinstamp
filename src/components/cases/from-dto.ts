import type { SharedCaseRow } from "@/components/attorney/types";
import type { FormTypeInsight, SharedCaseRow as SharedCaseDto, TrackedCaseDetail, TrackedCaseSummary as TrackedCaseSummaryDto } from "@/server/cases/queries";
import { needsReview } from "@/lib/attorney/review";
import { officialProcessingTimeFor } from "@/lib/processing-times/official";
import type { Bilingual, CaseDetail, InsightSummary, TrackedCaseSummary } from "./types";

// Maps the data-layer DTOs (src/server/cases/queries.ts) to the component props.

function bilingual(en: string | null, es: string | null): Bilingual | null {
  return en ? { en, es } : null;
}

export function toTrackedCaseSummary(dto: TrackedCaseSummaryDto): TrackedCaseSummary {
  return {
    trackedCaseId: dto.trackedCaseId,
    receiptNumber: dto.case.receiptNumber,
    nickname: dto.nickname,
    formType: dto.case.formType,
    status: bilingual(dto.case.statusEn, dto.case.statusEs),
    statusCategory: dto.case.category,
    checkState: dto.case.checkState,
    lastChangeOn: dto.lastChangeOn,
    lastSuccessfulCheckAt: dto.case.lastSuccessfulCheckAt,
    changedSinceLastVisit: dto.changedSinceLastVisit,
    nextKeyDate: null,
  };
}

export function toInsightSummary(dto: FormTypeInsight): InsightSummary {
  return { formType: dto.formType, count: dto.caseCount, medianDays: dto.medianDays, p25Days: dto.p25Days, p75Days: dto.p75Days };
}

type DetailContext = {
  /** Id of the signed-in person, to decide which key dates they may delete. */
  viewerId: string;
  /** Emails of share recipients that already have an attorney account. */
  attorneyAccounts: Set<string>;
  insights: FormTypeInsight[];
};

export function toCaseDetail(dto: TrackedCaseDetail, ctx: DetailContext): CaseDetail {
  const received = dto.timeline.find((e) => e.category === "received");
  const isOwner = dto.clientId === ctx.viewerId;
  const insight = dto.case.formType ? ctx.insights.find((i) => i.formType === dto.case.formType) : undefined;

  return {
    trackedCaseId: dto.trackedCaseId,
    receiptNumber: dto.case.receiptNumber,
    nickname: dto.nickname,
    formType: dto.case.formType,
    formTitle: null,
    status: bilingual(dto.case.statusEn, dto.case.statusEs),
    description: bilingual(dto.case.descriptionEn, dto.case.descriptionEs),
    statusCategory: dto.case.category,
    checkState: dto.case.checkState,
    receivedOn: received?.occurredOn ?? dto.case.submittedAt?.slice(0, 10) ?? null,
    lastChangeOn: dto.lastChangeOn,
    lastSuccessfulCheckAt: dto.case.lastSuccessfulCheckAt,
    lastErrorCode: dto.case.lastErrorCode,
    // The data layer sorts oldest first; the timeline shows the newest first.
    events: [...dto.timeline].reverse().map((e) => ({
      id: e.id,
      occurredOn: e.occurredOn,
      title: e.textEn,
      titleEs: e.textEs,
      description: e.descriptionEn,
      descriptionEs: e.descriptionEs,
      origin: e.origin,
      category: e.category,
    })),
    keyDates: dto.keyDates.map((k) => ({
      id: k.id,
      kind: k.kind,
      date: k.date,
      time: k.time?.slice(0, 5) ?? null,
      title: k.title,
      notes: k.notes,
      canDelete: isOwner || k.createdBy === ctx.viewerId,
    })),
    shares: dto.shares.map((s) => ({
      id: s.id,
      attorneyEmail: s.attorneyEmail,
      status: s.revokedAt ? "revoked" : ctx.attorneyAccounts.has(s.attorneyEmail) ? "active" : "pending",
      createdAt: s.createdAt,
      revokedAt: s.revokedAt,
    })),
    officialProcessingTime: officialProcessingTimeFor(dto.case.formType),
    insight: insight ? toInsightSummary(insight) : null,
  };
}

export function toSharedCaseRow(dto: SharedCaseDto): SharedCaseRow {
  return {
    shareId: dto.shareId,
    trackedCaseId: dto.trackedCaseId,
    clientName: dto.clientName,
    nickname: dto.nickname,
    receiptNumber: dto.receiptNumber,
    formType: dto.formType,
    status: bilingual(dto.statusEn, dto.statusEs),
    statusCategory: dto.category,
    checkState: dto.checkState,
    lastChangeOn: dto.lastChangeOn,
    lastSuccessfulCheckAt: dto.lastSuccessfulCheckAt,
    nextKeyDate: dto.nextKeyDate ? { date: dto.nextKeyDate } : null,
    needsReview: needsReview({ lastEventAt: dto.lastEventAt, reviewedAt: dto.reviewedAt, sharedAt: dto.sharedAt }),
  };
}
