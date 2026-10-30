import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil } from "@/lib/format/days";
import type { InsightSummary } from "./types";

type InsightMiniCardProps = {
  insight: InsightSummary | null;
  formType: string | null;
  /** `YYYY-MM-DD` of the first received event, to mark "your case" on the range. */
  receivedOn: string | null;
  now: Date;
  /** Hide the link for attorneys, who have no insights screen. */
  showLink?: boolean;
};

/** Small range bar: median and 25–75% of days from received to approved for this form type. */
export function InsightMiniCard({ insight, formType, receivedOn, now, showLink = true }: InsightMiniCardProps) {
  const t = useTranslations("caseDetail.insight");

  if (!insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md text-ink-muted">{formType ? t("notEnough", { form: formType }) : t("noForm")}</p>
        </CardContent>
      </Card>
    );
  }

  const scaleMax = Math.max(insight.p75Days * 1.25, receivedOn ? -daysUntil(receivedOn, now) * 1.1 : 0);
  const pct = (days: number) => `${Math.min(100, Math.round((days / scaleMax) * 100))}%`;
  const ageDays = receivedOn ? -daysUntil(receivedOn, now) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-md text-ink">
          {t("summary", { form: insight.formType, min: Math.round(insight.p25Days / 30.44), max: Math.round(insight.p75Days / 30.44), median: insight.medianDays })}
        </p>
        <div className="relative pt-1 pb-5" aria-hidden="true">
          <div className="h-2 rounded-full bg-line" />
          <div className="absolute top-1 h-2 rounded-full bg-ink/80" style={{ left: pct(insight.p25Days), width: `calc(${pct(insight.p75Days)} - ${pct(insight.p25Days)})` }} />
          <div className="absolute top-0 h-4 w-0.5 bg-ink" style={{ left: pct(insight.medianDays) }} />
          {ageDays !== null && (
            <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: pct(ageDays) }}>
              <span className="block size-4 rounded-full border-2 border-surface bg-stamp shadow-card" />
            </div>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-xs text-ink-muted">
          <div>
            <dt>{t("p25")}</dt>
            <dd className="font-semibold tabular text-ink">{t("days", { days: insight.p25Days })}</dd>
          </div>
          <div>
            <dt>{t("median")}</dt>
            <dd className="font-semibold tabular text-ink">{t("days", { days: insight.medianDays })}</dd>
          </div>
          <div>
            <dt>{t("p75")}</dt>
            <dd className="font-semibold tabular text-ink">{t("days", { days: insight.p75Days })}</dd>
          </div>
        </dl>
        {ageDays !== null && (
          <p className="flex items-center gap-2 text-sm text-ink">
            <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-stamp" />
            {t("yourCase", { days: ageDays })}
          </p>
        )}
        <p className="text-xs text-ink-subtle">{t("basis", { count: insight.count })}</p>
        {showLink && (
          <Link href="/insights" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink underline underline-offset-4 hover:text-stamp-ink">
            {t("link")}
            <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
