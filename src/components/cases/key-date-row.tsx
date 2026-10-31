import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { cn } from "@/lib/utils";
import { AddToCalendarMenu } from "./add-to-calendar-menu";
import { KeyDateNotes } from "./key-date-notes";
import type { KeyDate } from "./types";

type KeyDateRowProps = {
  keyDate: KeyDate;
  now: Date;
  /** The soonest upcoming key date: its date tile is filled black. */
  highlighted?: boolean;
  /** Already happened: the row is muted. */
  past?: boolean;
  /** `.ics` download URL. */
  icsHref?: string;
  /** Extra controls (e.g. delete) rendered after the download link, in the fixed actions column. */
  actions?: ReactNode;
};

const utc = { timeZone: "UTC" } as const;

/**
 * One key date: date tile · title, kind, time, countdown and notes · actions. The three columns
 * are a grid, so the actions keep the top-right corner at every width instead of wrapping below.
 */
export function KeyDateRow({ keyDate, now, highlighted = false, past = false, icsHref, actions }: KeyDateRowProps) {
  const t = useTranslations("caseDetail.keyDates");
  const format = useFormatter();
  // Date-only values are formatted in UTC so the server's time zone never shifts the day.
  const day = new Date(`${keyDate.date}T00:00:00Z`);
  const time = keyDate.time ? format.dateTime(new Date(`1970-01-01T${keyDate.time.slice(0, 5)}:00Z`), { hour: "numeric", minute: "2-digit", ...utc }) : null;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-3.5">
      <time
        dateTime={keyDate.date}
        className={cn(
          "flex w-12 flex-col items-center rounded-lg border py-1.5 tabular",
          highlighted ? "border-ink bg-ink text-white" : "border-line bg-canvas text-ink",
          past && "text-ink-muted",
        )}
      >
        <span className="text-caps leading-none">{format.dateTime(day, { month: "short", ...utc })}</span>
        <span className="mt-1 text-heading leading-none">{format.dateTime(day, { day: "numeric", ...utc })}</span>
        <span className="mt-1 text-[11px] leading-none">{format.dateTime(day, { weekday: "short", ...utc })}</span>
      </time>

      <div className="min-w-0">
        <p className={cn("text-md font-medium", past ? "text-ink-muted" : "text-ink")}>
          {highlighted && <span className="sr-only">{t("next")} · </span>}
          {keyDate.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <KeyDateChip kind={keyDate.kind} date={keyDate.date} now={now} />
          <p className="text-sm text-ink-muted">
            {t(`kind.${keyDate.kind}`)}
            {time && ` · ${t("time", { time })}`}
          </p>
        </div>
        {keyDate.notes && <KeyDateNotes notes={keyDate.notes} className="mt-2" />}
      </div>

      <div className="-mt-2.5 -mr-2 flex items-center sm:-mt-1.5">
        {icsHref && (
          <AddToCalendarMenu
            event={{ title: keyDate.title, notes: keyDate.notes, date: keyDate.date, time: keyDate.time?.slice(0, 5) ?? null }}
            icsHref={icsHref}
          />
        )}
        {actions}
      </div>
    </li>
  );
}
