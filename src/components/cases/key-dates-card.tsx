import { CalendarPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { groupKeyDates, UPCOMING_PREVIEW } from "@/lib/cases/key-dates";
import { previewSummary } from "@/lib/cases/key-dates-calendar";
import { cn } from "@/lib/utils";
import { KeyDatesCalendarTrigger, type KeyDateEntry } from "./key-dates-calendar";
import { KeyDateRow } from "./key-date-row";
import type { KeyDate } from "./types";

type KeyDatesCardProps = {
  keyDates: KeyDate[];
  now: Date;
  /** Case nickname or receipt, shown in the calendar view's header. */
  caseLabel?: string;
  /** Trigger of the add-key-date form. */
  addAction?: ReactNode;
  /** Builds the `.ics` download URL for a key date. */
  icsHref?: (keyDate: KeyDate) => string;
  /** Extra per-row controls (e.g. a delete button) rendered after the download link. */
  rowActions?: (keyDate: KeyDate) => ReactNode;
};

/**
 * Key dates of a case as a preview: a one-line summary, the three nearest upcoming rows (the
 * soonest highlighted) and a footer that opens the calendar view with every date, past ones
 * included. Rows are rendered here, on the server, and handed to the client calendar.
 */
export function KeyDatesCard({ keyDates, now, caseLabel, addAction, icsHref, rowActions }: KeyDatesCardProps) {
  const t = useTranslations("caseDetail.keyDates");
  const { upcoming, past } = groupKeyDates(keyDates, now);
  const summary = previewSummary(keyDates, now);
  const entry = (keyDate: KeyDate, options: { highlighted?: boolean; past?: boolean }): KeyDateEntry => ({
    keyDate,
    row: <KeyDateRow key={keyDate.id} keyDate={keyDate} now={now} icsHref={icsHref?.(keyDate)} actions={rowActions?.(keyDate)} {...options} />,
  });
  const entries = [...upcoming.map((keyDate, index) => entry(keyDate, { highlighted: index === 0 })), ...past.map((keyDate) => entry(keyDate, { past: true }))];
  const preview = entries.slice(0, Math.min(UPCOMING_PREVIEW, upcoming.length));
  const summaryText =
    summary.nextInDays === null ? t("summary.none") : `${t("summary.thisMonth", { count: summary.thisMonth })} · ${t("summary.next", { days: summary.nextInDays })}`;

  return (
    <Card data-tour="key-dates">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        {keyDates.length > 0 && <CardDescription>{summaryText}</CardDescription>}
        {addAction && <CardAction>{addAction}</CardAction>}
      </CardHeader>
      {keyDates.length === 0 ? (
        <CardContent>
          <p className="text-md text-ink-muted">{t("empty")}</p>
        </CardContent>
      ) : (
        <>
          {preview.length > 0 && (
            <CardContent className="-mt-2">
              <ul className="divide-y divide-line">{preview.map((item) => item.row)}</ul>
            </CardContent>
          )}
          <CardFooter className="p-0">
            <KeyDatesCalendarTrigger caseLabel={caseLabel} entries={entries} now={now} count={keyDates.length} />
          </CardFooter>
        </>
      )}
    </Card>
  );
}

/** Default trigger for the add form: full label from `sm`, icon-only (44px, labelled) on phones. */
export function AddKeyDateButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const t = useTranslations("caseDetail.keyDates");
  return (
    <Button variant="outline" size="sm" aria-label={t("add")} className={cn("max-sm:w-11 max-sm:px-0", className)} {...props}>
      <CalendarPlusIcon aria-hidden="true" />
      <span className="max-sm:sr-only">{t("add")}</span>
    </Button>
  );
}
