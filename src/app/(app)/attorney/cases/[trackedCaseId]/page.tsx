import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AssistantControl } from "@/components/assistant/wired/assistant-control";
import { CaseDetailView } from "@/components/cases/case-detail-view";
import { toCaseDetail } from "@/components/cases/from-dto";
import { AddKeyDateControl, DeleteKeyDateButton } from "@/components/cases/wired/key-date-controls";
import { RefreshControl } from "@/components/cases/wired/refresh-control";
import { TourLauncher } from "@/components/tour/tour-launcher";
import { requireProfile } from "@/server/auth";
import { getTrackedCaseDetail, listInsights } from "@/server/cases/queries";

export async function generateMetadata({ params }: PageProps<"/attorney/cases/[trackedCaseId]">): Promise<Metadata> {
  await io();
  const [{ trackedCaseId }, t] = await Promise.all([params, getTranslations("caseDetail")]);
  const detail = await getTrackedCaseDetail(trackedCaseId);
  return { title: detail?.nickname ?? detail?.case.receiptNumber ?? t("title") };
}

/** Shared view for attorneys: read, refresh and key dates; no share, rename or untrack. */
export default async function AttorneyCasePage({ params }: PageProps<"/attorney/cases/[trackedCaseId]">) {
  await io();
  const [{ trackedCaseId }, profile] = await Promise.all([params, requireProfile("attorney")]);
  // RLS returns the tracked case only while an active share names this attorney's email.
  const dto = await getTrackedCaseDetail(trackedCaseId);
  if (!dto) notFound();

  const insights = await listInsights();
  const detail = toCaseDetail(dto, { viewerId: profile.id, attorneyAccounts: new Set(), insights });
  const now = new Date();

  return (
    <div className="flex flex-1 flex-col fade-up">
      <CaseDetailView
        detail={detail}
        now={now}
        viewer="attorney"
        assistantTrigger={<AssistantControl trackedCaseId={trackedCaseId} caseLabel={detail.nickname ?? detail.receiptNumber} />}
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
