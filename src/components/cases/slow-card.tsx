import { ExternalLinkIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil } from "@/lib/format/days";
import { cn } from "@/lib/utils";
import type { OfficialProcessingTime } from "./types";

type SlowCardProps = {
  /** `YYYY-MM-DD` of the first received event. */
  receivedOn: string | null;
  officialTime: OfficialProcessingTime | null;
  now: Date;
  /** USCIS e-Request page for cases outside normal processing time. */
  eRequestUrl?: string;
};

const USCIS_E_REQUEST = "https://egov.uscis.gov/e-request/";

/** "Is my case slow?": case age vs. the official processing time, with its source and date. */
export function SlowCard({ receivedOn, officialTime, now, eRequestUrl = USCIS_E_REQUEST }: SlowCardProps) {
  const t = useTranslations("caseDetail.slow");
  const format = useFormatter();

  if (!receivedOn || !officialTime) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md text-ink-muted">{!receivedOn ? t("noReceivedDate") : t("noOfficialTime")}</p>
        </CardContent>
      </Card>
    );
  }

  const ageDays = -daysUntil(receivedOn, now);
  const ageMonths = ageDays / 30.44;
  const maxDays = Math.round(officialTime.maxMonths * 30.44);
  const minDays = Math.round(officialTime.minMonths * 30.44);
  const verdict = ageMonths > officialTime.maxMonths ? "outside" : ageMonths >= officialTime.minMonths ? "within" : "early";
  const progress = Math.min(100, Math.round((ageDays / maxDays) * 100));
  const minMark = Math.round((minDays / maxDays) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-md text-ink">
          {t(`verdict.${verdict}`, { months: Math.round(ageMonths * 10) / 10, min: officialTime.minMonths, max: officialTime.maxMonths })}
        </p>

        <div aria-hidden="true" className="relative h-2 w-full rounded-full bg-line">
          <div className="absolute inset-y-0 rounded-full bg-canvas-deep" style={{ left: `${minMark}%`, right: 0 }} />
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", verdict === "outside" ? "bg-status-action" : "bg-ink")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs tabular text-ink-muted">
          <span>{t("ageLabel", { days: ageDays })}</span>
          <span>{t("rangeLabel", { min: officialTime.minMonths, max: officialTime.maxMonths })}</span>
        </div>

        {verdict === "outside" && (
          <a
            href={eRequestUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink underline underline-offset-4 hover:text-stamp-ink"
          >
            {t("eRequest")}
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>
        )}

        <p className="text-xs text-ink-subtle">
          {t("source", { date: format.dateTime(new Date(`${officialTime.readOn}T00:00:00Z`), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) })}{" "}
          <a href={officialTime.sourceUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-ink">
            {t("sourceLink")}
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
