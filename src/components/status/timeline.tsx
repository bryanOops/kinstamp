import { useFormatter, useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  /** Calendar date `YYYY-MM-DD` as USCIS reports it. */
  occurredOn: string;
  /** English status title, plus the Spanish one when USCIS provided it. */
  title: string;
  titleEs?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  origin: "reported" | "observed";
  category?: string | null;
};

type TimelineProps = {
  /** Newest first. The first event is the current status and is highlighted. */
  events: TimelineEvent[];
  /** Id of an event to call out as newly observed ("New"). */
  highlightedEventId?: string | null;
  className?: string;
};

export function Timeline({ events, highlightedEventId, className }: TimelineProps) {
  const t = useTranslations("timeline");
  const format = useFormatter();
  const locale = useLocale();

  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">{t("empty")}</p>;
  }

  return (
    <ol className={cn("relative", className)}>
      {events.map((event, index) => {
        const isCurrent = index === 0;
        const isLast = index === events.length - 1;
        const isNew = event.id === highlightedEventId;
        const date = new Date(`${event.occurredOn}T00:00:00Z`);
        const title = locale === "es" && event.titleEs ? event.titleEs : event.title;
        const description = locale === "es" && event.descriptionEs ? event.descriptionEs : event.description;

        return (
          // Phones stack the date over the title next to the dot column; from `sm` the date gets its own column.
          <li key={event.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[7.5rem_1.25rem_minmax(0,1fr)] sm:gap-x-4">
            <time
              dateTime={event.occurredOn}
              className={cn(
                "col-start-2 row-start-1 pt-0.5 text-sm tabular sm:col-start-1 sm:text-right",
                isCurrent ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {format.dateTime(date, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </time>

            <div className="relative col-start-1 row-span-2 row-start-1 flex justify-center sm:col-start-2 sm:row-span-1">
              <span
                aria-hidden="true"
                className={cn("relative z-10 mt-1.5 block size-3 rounded-full ring-4 ring-surface", isCurrent ? "bg-stamp" : "bg-ink")}
              />
              {!isLast && <span aria-hidden="true" className="absolute top-4 bottom-0 w-px bg-line" />}
            </div>

            <div className={cn("col-start-2 row-start-2 min-w-0 sm:col-start-3 sm:row-start-1", !isLast && "pb-7")}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className={cn("text-md font-semibold tracking-[-0.01em] text-ink", isCurrent && "text-base")}>{title}</h3>
                <span className="text-xs text-ink-muted">{event.origin === "reported" ? t("reportedByUscis") : t("observedByKinstamp")}</span>
                {isNew && <span className="rounded-md bg-stamp-tint px-1.5 py-0.5 text-xs font-semibold text-stamp-ink">{t("new")}</span>}
              </div>
              {description && <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-ink-muted [overflow-wrap:anywhere]">{description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
