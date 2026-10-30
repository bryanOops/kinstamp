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
const DAYS_PER_MONTH = 30.44;

/**
 * "Is my case slow?": case age vs. the time USCIS publishes for the form type (80% of cases),
 * with its source and date. Renders nothing when no official figure is on file.
 */
export function SlowCard({ receivedOn, officialTime, now, eRequestUrl = USCIS_E_REQUEST }: SlowCardProps) {
  const t = useTranslations("caseDetail.slow");
  const format = useFormatter();

  if (!officialTime) return null;

  if (!receivedOn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md text-ink-muted">{t("noReceivedDate")}</p>
        </CardContent>
      </Card>
    );
  }

  const ageDays = Math.max(0, -daysUntil(receivedOn, now));
  const ageMonths = Math.round((ageDays / DAYS_PER_MONTH) * 10) / 10;
  const limitDays = Math.round(officialTime.months * DAYS_PER_MONTH);
  const outside = ageDays > limitDays;
  const progress = Math.min(100, Math.round((ageDays / limitDays) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-md text-ink">{t(outside ? "verdict.outside" : "verdict.within", { months: ageMonths, limit: officialTime.months })}</p>

        <div aria-hidden="true" className="relative h-2 w-full rounded-full bg-line">
          <div className={cn("absolute inset-y-0 left-0 rounded-full", outside ? "bg-status-action" : "bg-ink")} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs tabular text-ink-muted">
          <span>{t("ageLabel", { days: ageDays })}</span>
          <span>{t("limitLabel", { limit: officialTime.months })}</span>
        </div>

        {outside && (
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
