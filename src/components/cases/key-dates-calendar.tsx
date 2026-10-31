"use client";

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  addDays,
  addMonths,
  groupKeyDatesByDay,
  initialCalendarMonth,
  keyDatesInMonth,
  monthMatrix,
  monthOf,
  nextMonthWithKeyDates,
  summarizeKinds,
  toDateKey,
  weekdayOrder,
  weekStartFor,
  type KindSummary,
} from "@/lib/cases/key-dates-calendar";
import { cn } from "@/lib/utils";
import type { KeyDate } from "./types";

/** A key date with its row already rendered (on the server, with its wired actions). */
export type KeyDateEntry = { keyDate: KeyDate; row: ReactNode };

type KeyDatesCalendarProps = {
  /** Case nickname or receipt, shown under the title. */
  caseLabel?: string;
  entries: KeyDateEntry[];
  now: Date;
};

type Direction = "forward" | "backward";

const utc = { timeZone: "UTC" } as const;

/** Sunday Nov 1, 2026: `Date.UTC(2026, 10, 1 + weekday)` yields a date on that JS weekday, for the column headers. */
const WEEKDAY_ANCHOR = [2026, 10, 1] as const;

/** "See all key dates (N)": a quiet full-width button that opens the calendar view. */
export function KeyDatesCalendarTrigger({ count, ...calendar }: KeyDatesCalendarProps & { count: number }) {
  const t = useTranslations("caseDetail.keyDates");
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="h-12 w-full rounded-t-none rounded-b-xl text-ink-muted hover:text-ink" />}>
        <CalendarDaysIcon aria-hidden="true" />
        {t("seeAll", { count })}
      </DialogTrigger>
      <DialogContent
        className={cn(
          // Full-height sheet on phones; a fixed-height 880px dialog from `sm` so the month flip never resizes it.
          "flex h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 pb-0",
          "sm:h-[min(680px,calc(100dvh-4rem))] sm:max-w-[880px]",
        )}
      >
        <KeyDatesCalendar {...calendar} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Month calendar of a case's key dates: month navigation and summary, a hand-built grid with
 * one dot per kind on each day, and the month's (or the selected day's) agenda of rows.
 * Opens on the month of the next upcoming key date. State lives here and resets on each open.
 */
export function KeyDatesCalendar({ caseLabel, entries, now }: KeyDatesCalendarProps) {
  const t = useTranslations("caseDetail.keyDates.calendarView");
  const kindT = useTranslations("caseDetail.keyDates.kind");
  const format = useFormatter();
  const locale = useLocale();
  const weekStart = weekStartFor(locale);
  const agendaId = useId();
  const gridRef = useRef<HTMLTableElement>(null);
  const pendingFocus = useRef(false);

  const keyDates = entries.map((entry) => entry.keyDate);
  const rows = new Map(entries.map((entry) => [entry.keyDate.id, entry.row]));
  const byDay = groupKeyDatesByDay(keyDates);
  const today = toDateKey(now);

  const [month, setMonth] = useState(() => initialCalendarMonth(keyDates, now));
  const [direction, setDirection] = useState<Direction | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState(() => firstDayOfInterest(keyDates, month, today));

  const inMonth = keyDatesInMonth(keyDates, month);
  const monthKinds = summarizeKinds(inMonth);
  const agenda = selected ? (byDay.get(selected) ?? []) : inMonth;
  const nextMonth = nextMonthWithKeyDates(keyDates, month);

  const dayDate = (date: string) => new Date(`${date}T00:00:00Z`);
  const monthLabel = (value: string, style: "long" | "withYear") =>
    format.dateTime(dayDate(`${value}-01`), style === "long" ? { month: "long", ...utc } : { month: "long", year: "numeric", ...utc });
  const dayLabel = (date: string) => format.dateTime(dayDate(date), { weekday: "long", month: "long", day: "numeric", ...utc });
  const kindsText = (kinds: KindSummary) =>
    [kinds.dueDates > 0 && t("dueDates", { count: kinds.dueDates }), kinds.appointments > 0 && t("appointments", { count: kinds.appointments })].filter(Boolean).join(", ");

  /** Flip to another month; `nextFocused` is where the roving tab stop lands. */
  function goTo(target: string, nextFocused?: string) {
    if (target !== month) {
      setDirection(target > month ? "forward" : "backward");
      setMonth(target);
      setSelected(null);
    }
    setFocused(nextFocused ?? firstDayOfInterest(keyDates, target, today));
  }

  /** Keyboard navigation moves the roving focus; the new cell is focused once it exists. */
  function moveFocus(target: string) {
    pendingFocus.current = true;
    goTo(monthOf(target), target);
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      moveFocus(addDays(focused, step));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveFocus(sameDayIn(addMonths(month, event.key === "PageUp" ? -1 : 1), focused));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(event.key === "Home" ? `${month}-01` : lastDayOf(month));
    }
  }

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused, month]);

  const summaryLine = `${t("monthSummary", { count: monthKinds.total, month: monthLabel(month, "long") })}${monthKinds.total > 0 ? ` · ${kindsText(monthKinds)}` : ""}`;

  return (
    <>
      <div className="border-b border-line px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <DialogHeader className="gap-0.5">
          <DialogTitle>{t("title")}</DialogTitle>
          {caseLabel && <DialogDescription>{caseLabel}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={t("previousMonth")} onClick={() => goTo(addMonths(month, -1))}>
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            <h3 className="min-w-[11ch] text-center text-md font-semibold text-ink tabular first-letter:uppercase" aria-live="polite">
              {monthLabel(month, "withYear")}
            </h3>
            <Button variant="ghost" size="icon-sm" aria-label={t("nextMonth")} onClick={() => goTo(addMonths(month, 1))}>
              <ChevronRightIcon aria-hidden="true" />
            </Button>
            <Button variant="outline" size="xs" className="ml-1" disabled={month === monthOf(today)} onClick={() => goTo(monthOf(today), today)}>
              {t("today")}
            </Button>
          </div>
          <p className="text-sm text-ink-muted" role="status">
            {summaryLine}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto max-sm:pb-[max(--spacing(6),var(--safe-bottom))] sm:grid sm:grid-cols-[minmax(0,420px)_minmax(0,1fr)] sm:overflow-hidden">
        <div className="px-5 py-4 sm:border-r sm:border-line sm:px-6 sm:py-5">
          <div key={month} data-direction={direction ?? undefined} className="month-swap">
            <table ref={gridRef} role="grid" aria-label={t("grid", { month: monthLabel(month, "withYear") })} className="w-full table-fixed border-separate border-spacing-0.5" onKeyDown={onGridKeyDown}>
              <thead>
                <tr>
                  {weekdayOrder(weekStart).map((weekday) => {
                    const anchor = new Date(Date.UTC(WEEKDAY_ANCHOR[0], WEEKDAY_ANCHOR[1], WEEKDAY_ANCHOR[2] + weekday));
                    return (
                      <th key={weekday} scope="col" className="pb-2 text-center text-caps font-medium text-ink-muted" aria-label={format.dateTime(anchor, { weekday: "long", ...utc })}>
                        <span aria-hidden="true">{format.dateTime(anchor, { weekday: "short", ...utc })}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {monthMatrix(month, weekStart).map((week) => (
                  <tr key={week[0].date}>
                    {week.map(({ date, inMonth: insideMonth }) => {
                      if (!insideMonth) {
                        return (
                          <td key={date} className="p-0">
                            {/* Same number + dot-spacer stack as the buttons, so the digits sit on one baseline. */}
                            <span aria-hidden="true" className="flex h-11 flex-col items-center justify-center gap-0.5 text-sm text-ink-subtle tabular sm:h-10">
                              <span className="leading-none">{Number(date.slice(8))}</span>
                              <span className="h-1.5" />
                            </span>
                          </td>
                        );
                      }
                      const kinds = summarizeKinds(byDay.get(date) ?? []);
                      const isToday = date === today;
                      const isSelected = date === selected;
                      let label = isToday ? t("todayLabel", { date: dayLabel(date) }) : dayLabel(date);
                      if (kinds.total > 0) label = t("dayLabel", { date: label, summary: kindsText(kinds) });
                      return (
                        <td key={date} className="p-0">
                          <button
                            type="button"
                            data-date={date}
                            tabIndex={date === focused ? 0 : -1}
                            aria-label={label}
                            aria-pressed={isSelected}
                            onClick={() => setSelected(isSelected ? null : date)}
                            onFocus={() => setFocused(date)}
                            className={cn(
                              "flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-sm tabular outline-none transition-colors duration-(--duration-fast) ease-(--ease-standard) focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10",
                              isSelected ? "bg-ink text-white hover:bg-ink-hover" : "text-ink hover:bg-canvas-deep",
                              !isSelected && date < today && "text-ink-muted",
                              isToday && !isSelected && "font-semibold shadow-[inset_0_0_0_1px_var(--color-ink)]",
                            )}
                          >
                            <span className="leading-none">{Number(date.slice(8))}</span>
                            <span className="flex h-1.5 items-center gap-1" aria-hidden="true">
                              {kinds.dueDates > 0 && <span className="size-1.5 rounded-full bg-stamp" />}
                              {kinds.appointments > 0 && <span className={cn("size-1.5 rounded-full", isSelected ? "bg-white" : "bg-ink")} />}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-stamp" />
              {kindT("due_date")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-ink" />
              {kindT("appointment")}
            </li>
          </ul>
        </div>

        <section aria-labelledby={agendaId} className="px-5 pb-4 sm:min-h-0 sm:overflow-y-auto sm:px-6 sm:py-5">
          <div className="flex min-h-9 items-center justify-between gap-3 border-t border-line pt-4 sm:border-t-0 sm:pt-0">
            <h3 id={agendaId} className="text-sm font-medium text-ink first-letter:uppercase">
              {selected ? t("selectedDay", { count: agenda.length, date: dayLabel(selected) }) : monthLabel(month, "withYear")}
            </h3>
            {selected && (
              <Button variant="ghost" size="xs" className="-mr-2 text-ink-muted hover:text-ink" onClick={() => setSelected(null)}>
                {t("showMonth")}
              </Button>
            )}
          </div>
          <div key={month} data-direction={direction ?? undefined} className="month-swap">
            {agenda.length > 0 ? (
              <ul className="divide-y divide-line">{agenda.map((keyDate) => rows.get(keyDate.id))}</ul>
            ) : (
              <div className="flex flex-col items-start gap-2 py-6 text-sm text-ink-muted">
                <p>{selected ? t("emptyDay", { date: dayLabel(selected) }) : t("emptyMonth", { month: monthLabel(month, "long") })}</p>
                {!selected && nextMonth && (
                  <Button variant="link" className="text-sm" onClick={() => goTo(nextMonth)}>
                    {t("jumpTo", { month: monthLabel(nextMonth, "withYear") })}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/** Where the roving tab stop lands in a month: its first key date, else today, else the 1st. */
function firstDayOfInterest(keyDates: readonly KeyDate[], month: string, today: string): string {
  return keyDatesInMonth(keyDates, month)[0]?.date ?? (monthOf(today) === month ? today : `${month}-01`);
}

function lastDayOf(month: string): string {
  return addDays(`${addMonths(month, 1)}-01`, -1);
}

/** The same day-of-month in another month, clamped to its length (Jan 31 → Feb 28). */
function sameDayIn(month: string, date: string): string {
  const day = Math.min(Number(date.slice(8)), Number(lastDayOf(month).slice(8)));
  return `${month}-${String(day).padStart(2, "0")}`;
}
