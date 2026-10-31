"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { UPCOMING_PREVIEW } from "@/lib/cases/key-dates";
import { cn } from "@/lib/utils";

type KeyDatesListProps = {
  /** Upcoming rows, soonest first (already rendered by the card). */
  upcoming: ReactNode[];
  /** Past rows, most recent first. */
  past: ReactNode[];
};

/**
 * The body of the Key dates card: the first `UPCOMING_PREVIEW` upcoming rows, the rest behind
 * "Show all N", and past rows behind a closed "Past (N)" disclosure. Both reveal inline with a
 * height + opacity transition, so the card stays about one screen tall however many dates exist.
 */
export function KeyDatesList({ upcoming, past }: KeyDatesListProps) {
  const t = useTranslations("caseDetail.keyDates");
  const [expanded, setExpanded] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const moreId = useId();
  const pastId = useId();
  const preview = upcoming.slice(0, UPCOMING_PREVIEW);
  const rest = upcoming.slice(UPCOMING_PREVIEW);

  return (
    <div className="-mt-2">
      {upcoming.length === 0 ? (
        <p className="py-1.5 text-sm text-ink-muted">{t("noUpcoming")}</p>
      ) : (
        <ul className="divide-y divide-line">{preview}</ul>
      )}

      {rest.length > 0 && (
        <>
          <Collapse id={moreId} open={expanded}>
            <ul className="divide-y divide-line border-t border-line">{rest}</ul>
          </Collapse>
          <Button variant="ghost" size="sm" className="mt-1 w-full text-ink-muted hover:text-ink" aria-expanded={expanded} aria-controls={moreId} onClick={() => setExpanded((value) => !value)}>
            <ChevronDownIcon aria-hidden="true" className={cn("transition-transform duration-(--duration-base) ease-(--ease-standard)", expanded && "rotate-180")} />
            {expanded ? t("showFewer") : t("showAll", { count: upcoming.length })}
          </Button>
        </>
      )}

      {past.length > 0 && (
        <div className={cn("border-t border-line", rest.length > 0 ? "mt-2" : "mt-1")}>
          <button
            type="button"
            className="flex h-11 w-full items-center gap-1.5 rounded-lg text-sm font-medium text-ink-muted outline-none transition-colors duration-(--duration-fast) hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-10"
            aria-expanded={pastOpen}
            aria-controls={pastId}
            onClick={() => setPastOpen((value) => !value)}
          >
            <ChevronRightIcon aria-hidden="true" className={cn("size-4 transition-transform duration-(--duration-base) ease-(--ease-standard)", pastOpen && "rotate-90")} />
            {t("past", { count: past.length })}
          </button>
          <Collapse id={pastId} open={pastOpen}>
            <ul className="divide-y divide-line border-t border-line">{past}</ul>
          </Collapse>
        </div>
      )}
    </div>
  );
}

/**
 * Inline reveal: a one-row grid going from 0fr to 1fr animates to the content's natural height,
 * which plain `height: auto` cannot. Hidden content is `inert` so it is skipped by focus and
 * assistive tech. Reduced motion inherits the global 0.01ms durations.
 */
function Collapse({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-(--duration-slow) ease-(--ease-standard)",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
