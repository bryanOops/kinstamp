import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AssistantControl } from "@/components/assistant/wired/assistant-control";
import { CaseDetailView } from "@/components/cases/case-detail-view";
import { toCaseDetail } from "@/components/cases/from-dto";
import { CaseMenu } from "@/components/cases/wired/case-menu";
import { AddKeyDateControl, DeleteKeyDateButton } from "@/components/cases/wired/key-date-controls";
import { MarkViewed } from "@/components/cases/wired/mark-viewed";
import { RefreshControl } from "@/components/cases/wired/refresh-control";
import { RevokeShareButton, ShareControl } from "@/components/cases/wired/share-control";
import { requireProfile } from "@/server/auth";
import { attorneyAccountEmails, getTrackedCaseDetail, listInsights } from "@/server/cases/queries";

export async function generateMetadata({ params }: PageProps<"/cases/[trackedCaseId]">): Promise<Metadata> {
  await io();
  const [{ trackedCaseId }, t] = await Promise.all([params, getTranslations("caseDetail")]);
  const detail = await getTrackedCaseDetail(trackedCaseId);
  return { title: detail?.nickname ?? detail?.case.receiptNumber ?? t("title") };
}

export default async function CaseDetailPage({ params }: PageProps<"/cases/[trackedCaseId]">) {
  await io();
  const [{ trackedCaseId }, profile] = await Promise.all([params, requireProfile("client")]);
  const dto = await getTrackedCaseDetail(trackedCaseId);
  if (!dto) notFound();

  const activeEmails = dto.shares.filter((s) => !s.revokedAt).map((s) => s.attorneyEmail);
  const [insights, attorneyAccounts] = await Promise.all([listInsights(), attorneyAccountEmails(activeEmails)]);
  const detail = toCaseDetail(dto, { viewerId: profile.id, attorneyAccounts, insights });
  const now = new Date();
  // The newest event is called out when it appeared after the last visit.
  const highlightedEventId = dto.changedSinceLastVisit ? (detail.events[0]?.id ?? null) : null;

  return (
    <div className="flex flex-1 flex-col fade-up">
      <MarkViewed trackedCaseId={trackedCaseId} />
      <CaseDetailView
        detail={detail}
        now={now}
        viewer="client"
        highlightedEventId={highlightedEventId}
        menu={<CaseMenu trackedCaseId={trackedCaseId} nickname={detail.nickname} receiptNumber={detail.receiptNumber} />}
        assistantTrigger={<AssistantControl trackedCaseId={trackedCaseId} caseLabel={detail.nickname ?? detail.receiptNumber} />}
        refresh={
          <RefreshControl
            trackedCaseId={trackedCaseId}
            now={now}
            lastChangeOn={detail.lastChangeOn}
            lastSuccessfulCheckAt={detail.lastSuccessfulCheckAt}
          />
        }
        shareTrigger={<ShareControl trackedCaseId={trackedCaseId} shares={detail.shares} />}
        shareActions={(share) => <RevokeShareButton share={share} />}
        addKeyDate={<AddKeyDateControl trackedCaseId={trackedCaseId} />}
        icsHref={(keyDate) => `/cases/${trackedCaseId}/key-dates/${keyDate.id}/ics`}
        keyDateActions={(keyDate) => (keyDate.canDelete ? <DeleteKeyDateButton keyDate={keyDate} /> : null)}
      />
    </div>
  );
}
