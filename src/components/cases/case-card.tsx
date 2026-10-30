import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusIndicator } from "@/components/status/status-indicator";
import { cn } from "@/lib/utils";
import type { Bilingual, TrackedCaseSummary } from "./types";

export function localizedText(text: Bilingual | null, locale: string): string | null {
  if (!text) return null;
  return locale === "es" && text.es ? text.es : text.en;
}

/** Formats a `YYYY-MM-DD` calendar date without time-zone drift. */
export function calendarDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

type CaseCardProps = {
  tracked: TrackedCaseSummary;
  now: Date;
  className?: string;
};

/** One tracked case in the client dashboard. The whole card is the link to the detail. */
export function CaseCard({ tracked, now, className }: CaseCardProps) {
  const t = useTranslations("cases.card");
  const locale = useLocale();
  const format = useFormatter();
  const status = localizedText(tracked.status, locale);
  const awaiting = tracked.checkState === "awaiting_first_check" || !status;

  return (
    <Link
      href={`/cases/${tracked.trackedCaseId}`}
      data-tour="case-card"
      className={cn(
        "group relative grid gap-4 rounded-xl border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-(--ease-out-expo) hover:border-ink-disabled hover:shadow-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.995] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-subheading truncate text-ink">{tracked.nickname ?? tracked.receiptNumber}</h2>
          {tracked.changedSinceLastVisit && (
            <span className="rounded-md bg-stamp-tint px-1.5 py-0.5 text-xs font-semibold text-stamp-ink">{t("changed")}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <ReceiptNumber value={tracked.receiptNumber} size="sm" />
          {tracked.formType && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("form", { form: tracked.formType })}</span>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {awaiting ? (
          <StatusIndicator label={t("awaitingFirstCheck")} category={null} />
        ) : (
          <StatusIndicator label={status} category={tracked.statusCategory} />
        )}
        <p className="mt-1 text-sm text-ink-muted">
          {tracked.lastChangeOn
            ? t("lastChange", { date: format.dateTime(calendarDate(tracked.lastChangeOn), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) })
            : awaiting
              ? t("awaitingHint")
              : t("noChangesYet")}
        </p>
        {tracked.nextKeyDate && (
          <KeyDateChip kind={tracked.nextKeyDate.kind} date={tracked.nextKeyDate.date} title={tracked.nextKeyDate.title} now={now} className="mt-2" />
        )}
      </div>

      <span
        aria-hidden="true"
        className="hidden size-9 items-center justify-center rounded-full border border-line text-ink-muted transition-[transform,color,border-color] duration-(--duration-base) ease-(--ease-out-expo) group-hover:translate-x-0.5 group-hover:border-ink group-hover:text-ink sm:inline-flex"
      >
        <ArrowRightIcon className="size-4" />
      </span>
    </Link>
  );
}
