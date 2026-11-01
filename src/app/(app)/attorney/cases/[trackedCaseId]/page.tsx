import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClientIdentity } from "@/components/attorney/client-identity";
import { AttorneyNotes } from "@/components/attorney/wired/attorney-notes";
import { ReviewControl } from "@/components/attorney/wired/review-control";
import { AssistantControl } from "@/components/assistant/wired/assistant-control";
import { CaseDetailView } from "@/components/cases/case-detail-view";
import { toCaseDetail } from "@/components/cases/from-dto";
import { AddKeyDateControl, DeleteKeyDateButton } from "@/components/cases/wired/key-date-controls";
import { RefreshControl } from "@/components/cases/wired/refresh-control";
import { TourLauncher } from "@/components/tour/tour-launcher";
import { needsReview } from "@/lib/attorney/review";
import { getReviewedAt, getSharedCaseClient, listAttorneyNotes } from "@/server/attorney/queries";
import { requireProfile } from "@/server/auth";
import { getTrackedCaseDetail, listInsights } from "@/server/cases/queries";

export async function generateMetadata({ params }: PageProps<"/attorney/cases/[trackedCaseId]">): Promise<Metadata> {
  await io();
  const [{ trackedCaseId }, t] = await Promise.all([params, getTranslations("caseDetail")]);
  const detail = await getTrackedCaseDetail(trackedCaseId);
  return { title: detail?.nickname ?? detail?.case.receiptNumber ?? t("title") };
}

/**
 * Shared view for attorneys: read, refresh and key dates, plus their own tools (who shared it,
 * private notes, mark as reviewed); no share, rename or untrack. Opening it does not mark it as reviewed.
 */
export default async function AttorneyCasePage({ params }: PageProps<"/attorney/cases/[trackedCaseId]">) {
  await io();
  const [{ trackedCaseId }, profile] = await Promise.all([params, requireProfile("attorney")]);
  // RLS returns the tracked case (and the attorney's notes and review) only while an active share
  // names this attorney's email, so all of it can be read in parallel.
  const [dto, insights, client, notes, reviewedAt] = await Promise.all([
    getTrackedCaseDetail(trackedCaseId),
    listInsights(),
    getSharedCaseClient(trackedCaseId),
    listAttorneyNotes(trackedCaseId),
    getReviewedAt(trackedCaseId),
  ]);
  if (!dto) notFound();
  const detail = toCaseDetail(dto, { viewerId: profile.id, attorneyAccounts: new Set(), insights });
  const caseLabel = detail.nickname ?? detail.receiptNumber;
  const review = client && needsReview({ lastEventAt: dto.lastEventAt, reviewedAt, sharedAt: client.sharedAt });
  const now = new Date();

  return (
    <div className="flex flex-1 flex-col fade-up">
      <CaseDetailView
        detail={detail}
        now={now}
        viewer="attorney"
        menu={client && <ReviewControl trackedCaseId={trackedCaseId} needsReview={Boolean(review)} />}
        headerExtra={client && <ClientIdentity clientName={client.clientName} clientEmail={client.clientEmail} sharedAt={client.sharedAt} caseLabel={caseLabel} />}
        notes={<AttorneyNotes trackedCaseId={trackedCaseId} caseLabel={caseLabel} notes={notes} now={now} />}
        assistantTrigger={<AssistantControl trackedCaseId={trackedCaseId} caseLabel={caseLabel} />}
        refresh={
          <RefreshControl
            trackedCaseId={trackedCaseId}
            now={now}
            lastChangeOn={detail.lastChangeOn}
            lastSuccessfulCheckAt={detail.lastSuccessfulCheckAt}
          />
        }
        addKeyDate={<AddKeyDateControl trackedCaseId={trackedCaseId} />}
        icsHref={(keyDate) => `/cases/${trackedCaseId}/key-dates/${keyDate.id}/ics`}
        keyDateActions={(keyDate) => (keyDate.canDelete ? <DeleteKeyDateButton keyDate={keyDate} /> : null)}
      />
      <TourLauncher tour="case_detail" completed={profile.toursCompleted.includes("case_detail")} />
    </div>
  );
}
