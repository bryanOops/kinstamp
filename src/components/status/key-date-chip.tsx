import { CalendarClockIcon, CalendarDaysIcon, CalendarIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { daysUntil, urgencyFor, type Urgency } from "@/lib/format/days";
import { cn } from "@/lib/utils";

export type KeyDateKind = "due_date" | "appointment";

type KeyDateChipProps = {
  /** Omitted when the screen only knows the date (e.g. the attorney table). */
  kind?: KeyDateKind;
  /** `YYYY-MM-DD` */
  date: string;
  title?: string;
  /** Reference instant, passed in so rendering stays deterministic. */
  now: Date;
  className?: string;
};

const urgencyStyles: Record<Urgency, string> = {
  past: "border-line bg-canvas text-ink-muted",
  today: "border-status-denied/30 bg-status-denied-tint text-status-denied",
  soon: "border-status-action/30 bg-status-action-tint text-status-action",
  later: "border-line bg-surface text-ink",
};

const icons = { due_date: CalendarClockIcon, appointment: CalendarIcon, generic: CalendarDaysIcon } as const;

/** Countdown chip: "Due in 12 days", "Appointment today", "In 3 days". */
export function KeyDateChip({ kind, date, title, now, className }: KeyDateChipProps) {
  const t = useTranslations("keyDates");
  const format = useFormatter();
  const days = daysUntil(date, now);
  const urgency = urgencyFor(days);
  const Icon = icons[kind ?? "generic"];
  const label = t(`countdown.${kind ?? "generic"}.${urgency}`, { days: Math.abs(days) });
  const dateLabel = format.dateTime(new Date(`${date}T00:00:00Z`), { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        urgencyStyles[urgency],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {label}
        {title ? ` · ${title}` : ""}
      </span>
      <span className="sr-only">({dateLabel})</span>
    </span>
  );
}
