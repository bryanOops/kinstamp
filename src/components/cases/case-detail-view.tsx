import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Banner } from "@/components/status/banner";
import { Timeline } from "@/components/status/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseHeader } from "./case-header";
import { CurrentStatusCard } from "./current-status-card";
import { InsightMiniCard } from "./insight-mini-card";
import { KeyDatesCard } from "./key-dates-card";
import { PlainEnglishCard } from "./plain-english-card";
import { SharedWithCard } from "./shared-with-card";
import { SlowCard } from "./slow-card";
import type { CaseDetail, KeyDate, Share } from "./types";

type CaseDetailViewProps = {
  detail: CaseDetail;
  now: Date;
  /** Attorneys see no share card and no insights link; they can refresh and add key dates. */
  viewer: "client" | "attorney";
  /** Slots filled by the data layer. */
  refresh?: ReactNode;
  shareTrigger?: ReactNode;
  assistantTrigger?: ReactNode;
  addKeyDate?: ReactNode;
  icsHref?: (keyDate: KeyDate) => string;
  onDeleteKeyDate?: (keyDate: KeyDate) => void;
  onRevokeShare?: (share: Share) => void;
  /** Id of the event observed by the latest refresh, highlighted on the timeline. */
  highlightedEventId?: string | null;
};

/** The full case detail layout. Every slot is optional so the data layer wires what exists. */
export function CaseDetailView({
  detail,
  now,
  viewer,
  refresh,
  shareTrigger,
  assistantTrigger,
  addKeyDate,
  icsHref,
  onDeleteKeyDate,
  onRevokeShare,
  highlightedEventId,
}: CaseDetailViewProps) {
  const t = useTranslations("caseDetail");
  const format = useFormatter();
  const offline = detail.checkState === "error" && detail.lastErrorCode === "unavailable";

  return (
    <div className="flex flex-col gap-8">
      <CaseHeader
        detail={detail}
        backHref={viewer === "attorney" ? "/attorney" : "/cases"}
        backLabel={viewer === "attorney" ? t("breadcrumbClientsCases") : t("breadcrumbCases")}
        actions={
          <>
            {assistantTrigger}
            {viewer === "client" && shareTrigger}
            {refresh}
          </>
        }
      />

      {offline && (
        <Banner
          variant="warning"
          title={t("offline.title")}
          description={
            detail.lastSuccessfulCheckAt
              ? t("offline.description", { time: format.dateTime(new Date(detail.lastSuccessfulCheckAt), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })
              : t("offline.descriptionNoSaved")
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <CurrentStatusCard detail={detail} now={now} />
          <PlainEnglishCard category={detail.checkState === "awaiting_first_check" ? null : detail.statusCategory} />
          <SlowCard receivedOn={detail.receivedOn} officialTime={detail.officialProcessingTime} now={now} />
        </div>
        <div className="flex flex-col gap-6">
          <KeyDatesCard keyDates={detail.keyDates} now={now} addAction={addKeyDate} icsHref={icsHref} onDelete={onDeleteKeyDate} />
          {viewer === "client" && <SharedWithCard shares={detail.shares} shareAction={shareTrigger} onRevoke={onRevokeShare} />}
          <InsightMiniCard insight={detail.insight} formType={detail.formType} receivedOn={detail.receivedOn} now={now} showLink={viewer === "client"} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("timeline.title")}</CardTitle>
          <p className="text-sm text-ink-muted">{t("timeline.description")}</p>
        </CardHeader>
        <CardContent className="pt-2">
          <Timeline events={detail.events} highlightedEventId={highlightedEventId} />
        </CardContent>
      </Card>
    </div>
  );
}
