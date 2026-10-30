"use client";

import { RefreshCwIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RefreshState } from "./types";

type RefreshButtonProps = {
  state: RefreshState;
  now: Date;
  onRefresh?: () => void;
  className?: string;
};

/**
 * Refresh action plus its outcome line: idle / pending / "Checked 20 seconds ago" /
 * "No changes since …" / "Status changed" / error. The line is a live region.
 */
export function RefreshButton({ state, now, onRefresh, className }: RefreshButtonProps) {
  const t = useTranslations("caseDetail.refresh");
  const errorsT = useTranslations("caseDetail.refresh.errors");
  const format = useFormatter();
  const pending = state.kind === "pending";

  const message = (() => {
    switch (state.kind) {
      case "idle":
        return null;
      case "pending":
        return t("pending");
      case "recent":
        return t("recent", { time: format.relativeTime(new Date(state.checkedAt), now) });
      case "unchanged":
        return t("unchanged", { date: format.dateTime(new Date(state.since), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) });
      case "changed":
        return t("changed");
      case "error":
        return errorsT.has(state.code) ? errorsT(state.code) : errorsT("unknown");
    }
  })();

  return (
    <div className={cn("flex flex-col items-start gap-2 sm:items-end", className)}>
      <Button onClick={onRefresh} disabled={pending} aria-busy={pending}>
        <RefreshCwIcon aria-hidden="true" className={cn(pending && "animate-spin motion-reduce:animate-none")} />
        {pending ? t("pendingButton") : t("button")}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "min-h-5 text-sm",
          state.kind === "changed" && "font-semibold text-stamp-ink",
          state.kind === "error" && "text-destructive",
          (state.kind === "idle" || state.kind === "pending" || state.kind === "recent" || state.kind === "unchanged") && "text-ink-muted",
        )}
      >
        {message}
        {state.kind === "error" && state.lastSavedAt && (
          <span className="block text-ink-muted">
            {t("showingSaved", { date: format.dateTime(new Date(state.lastSavedAt), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })}
          </span>
        )}
      </p>
    </div>
  );
}
