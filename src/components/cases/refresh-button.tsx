"use client";

import { RefreshCwIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RefreshState } from "@/server/actions/cases";

type RefreshButtonProps = {
  state: RefreshState;
  pending?: boolean;
  now: Date;
  /** `YYYY-MM-DD` of the newest status event, for "No changes since …". */
  lastChangeOn?: string | null;
  /** Shown after an error so the person knows how old the status on screen is. */
  lastSuccessfulCheckAt?: string | null;
  onRefresh?: () => void;
  className?: string;
};

/**
 * Refresh action plus its outcome line: idle / checking / "Checked 20 seconds ago" /
 * "No changes since …" / "Status changed" / error. The line is a live region.
 */
export function RefreshButton({ state, pending = false, now, lastChangeOn, lastSuccessfulCheckAt, onRefresh, className }: RefreshButtonProps) {
  const t = useTranslations("caseDetail.refresh");
  const errorsT = useTranslations("caseDetail.refresh.errors");
  const format = useFormatter();

  const message = (() => {
    if (pending) return t("pending");
    switch (state.status) {
      case "idle":
        return null;
      case "reused":
        return t("recent", { time: format.relativeTime(new Date(state.checkedAt), now) });
      case "unchanged":
        return lastChangeOn
          ? t("unchanged", { date: format.dateTime(new Date(`${lastChangeOn}T00:00:00Z`), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) })
          : t("unchangedNoDate");
      case "changed":
        return t("changed");
      case "error":
        if (state.outsideHours) return errorsT("outsideHours");
        return errorsT.has(state.errorCode) ? errorsT(state.errorCode) : errorsT("unknown");
    }
  })();

  const tone = pending || state.status === "idle" || state.status === "reused" || state.status === "unchanged" ? "muted" : state.status;

  return (
    <div className={cn("flex flex-col items-start gap-2 sm:items-end", className)}>
      <Button onClick={onRefresh} disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
        <RefreshCwIcon aria-hidden="true" className={cn(pending && "animate-spin motion-reduce:animate-none")} />
        {pending ? t("pendingButton") : t("button")}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "min-h-5 text-sm sm:text-right",
          tone === "muted" && "text-ink-muted",
          tone === "changed" && "font-semibold text-stamp-ink",
          tone === "error" && "text-destructive",
        )}
      >
        {message}
        {state.status === "error" && lastSuccessfulCheckAt && (
          <span className="block font-normal text-ink-muted">
            {t("showingSaved", { date: format.dateTime(new Date(lastSuccessfulCheckAt), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })}
          </span>
        )}
      </p>
    </div>
  );
}
