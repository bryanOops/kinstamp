import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Banner } from "@/components/status/banner";
import { Timeline } from "@/components/status/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStatusCategory } from "@/lib/status-tone/status-tone";
import { cn } from "@/lib/utils";
import { CaseHeader } from "./case-header";
import { InsightMiniCard } from "./insight-mini-card";
import { KeyDatesCard } from "./key-dates-card";
import { NextStepsCard } from "./next-steps-card";
import { SharedWithCard } from "./shared-with-card";
import { SlowCard } from "./slow-card";
import { StatusHero } from "./status-hero";
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
  /** Header actions on the right of the title (review state, rename, stop tracking…). */
  menu?: ReactNode;
  addKeyDate?: ReactNode;
  icsHref?: (keyDate: KeyDate) => string;
  keyDateActions?: (keyDate: KeyDate) => ReactNode;
  shareActions?: (share: Share) => ReactNode;
  /** Id of the event observed since the last visit, highlighted on the timeline. */
  highlightedEventId?: string | null;
  /** Second row of the header band, under the title (attorneys: the client who shared the case). */
  headerExtra?: ReactNode;
  /** Private notes card (attorneys only), first in the aside. */
  notes?: ReactNode;
};

/**
 * The full case detail layout. Every slot is optional so the data layer wires what exists.
 *
 * Hierarchy: header band (title, receipt, form, actions, optional second row) → status hero
 * (status, meaning, actions) → two columns from `lg`. Main: next steps, timeline. Aside: notes,
 * key dates, sharing, slow check, insight. On phones the cards form one column ordered by what
 * the reader needs first: notes and key dates right after the hero; clients then read what comes
 * next before the timeline, attorneys the timeline before the general next steps.
 */
export function CaseDetailView({
  detail,
  now,
  viewer,
  refresh,
  shareTrigger,
  assistantTrigger,
  menu,
  addKeyDate,
  icsHref,
  keyDateActions,
  shareActions,
  highlightedEventId,
  headerExtra,
  notes,
}: CaseDetailViewProps) {
  const t = useTranslations("caseDetail");
  const format = useFormatter();
  // A successful check clears lastErrorCode, so any value means the latest check failed.
  const offline = detail.lastErrorCode === "unavailable" || detail.lastErrorCode === "timeout";
  const awaiting = detail.checkState === "awaiting_first_check";
  const plainKey = isStatusCategory(detail.statusCategory) ? detail.statusCategory : "other";
  const hasNextSteps = !awaiting && t.has(`plain.${plainKey}.next.1`);
  const showShares = viewer === "client";
  const attorney = viewer === "attorney";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-5 border-b border-line pb-5 sm:gap-6 sm:pb-6">
        <CaseHeader
          detail={detail}
          backHref={attorney ? "/attorney" : "/cases"}
          backLabel={attorney ? t("breadcrumbClientsCases") : t("breadcrumbCases")}
          actions={menu}
        />
        {headerExtra}
      </div>

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

      <StatusHero
        detail={detail}
        now={now}
        primaryAction={refresh}
        secondaryActions={
          showShares && shareTrigger ? (
            <>
              {shareTrigger}
              {assistantTrigger}
            </>
          ) : (
            assistantTrigger
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        {/* Main column. `contents` on phones lets the cards interleave with the aside by `order`. */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {hasNextSteps && (
            <Slot order={attorney ? "order-4" : "order-3"}>
              <NextStepsCard category={detail.statusCategory} />
            </Slot>
          )}
          <Slot order={attorney ? "order-3" : "order-4"}>
            <Card data-tour="timeline">
              <CardHeader>
                <CardTitle>{t("timeline.title")}</CardTitle>
                <p className="text-sm text-ink-muted">{t("timeline.description")}</p>
              </CardHeader>
              <CardContent className="pt-2">
                <Timeline events={detail.events} highlightedEventId={highlightedEventId} />
              </CardContent>
            </Card>
          </Slot>
        </div>

        {/* Aside column: the reader's own tools first. */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {notes && <Slot order="order-1">{notes}</Slot>}
          <Slot order="order-2">
            <KeyDatesCard
              keyDates={detail.keyDates}
              now={now}
              caseLabel={detail.nickname ?? detail.receiptNumber}
              addAction={addKeyDate}
              icsHref={icsHref}
              rowActions={keyDateActions}
            />
          </Slot>
          {showShares && (
            <Slot order="order-5">
              <SharedWithCard shares={detail.shares} shareAction={shareTrigger} rowActions={shareActions} />
            </Slot>
          )}
          {detail.officialProcessingTime && (
            <Slot order="order-6">
              <SlowCard receivedOn={detail.receivedOn} officialTime={detail.officialProcessingTime} now={now} />
            </Slot>
          )}
          {detail.insight && (
            <Slot order="order-7">
              <InsightMiniCard insight={detail.insight} formType={detail.formType} receivedOn={detail.receivedOn} now={now} showLink={viewer === "client"} />
            </Slot>
          )}
        </div>
      </div>
    </div>
  );
}

/** One card position: ordered on phones, natural order inside its column from `lg`. */
function Slot({ order, children }: { order: `order-${number}`; children: ReactNode }) {
  return <div className={cn("min-w-0", order, "lg:order-none")}>{children}</div>;
}
