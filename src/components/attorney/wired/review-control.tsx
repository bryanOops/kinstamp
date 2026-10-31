"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { NewUpdateMark } from "@/components/attorney/new-update-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markCaseReviewed } from "@/server/actions/attorney";

type ReviewControlProps = {
  trackedCaseId: string;
  /** From src/lib/attorney/review.ts, computed on the server. */
  needsReview: boolean;
  /**
   * `header`: in the page header actions, from `sm` up. `bar`: its own row under the header on
   * phones, where a long button would squeeze the case title.
   */
  placement: "header" | "bar";
};

/**
 * Case detail header action for attorneys: "New update" + "Mark as reviewed" while the case has a
 * status event the attorney has not reviewed; a quiet "Reviewed" once it is cleared. Opening the
 * case never marks it.
 */
export function ReviewControl({ trackedCaseId, needsReview, placement }: ReviewControlProps) {
  const t = useTranslations("attorney.review");
  const [pending, startTransition] = useTransition();
  const [optimisticNeedsReview, setOptimisticNeedsReview] = useOptimistic(needsReview);
  const visibility = placement === "header" ? "hidden sm:flex" : "flex sm:hidden";

  if (!optimisticNeedsReview) {
    return (
      <span role="status" className={cn(visibility, "h-11 items-center gap-1.5 text-sm text-ink-muted sm:h-9")}>
        <CheckIcon className="size-4" aria-hidden="true" />
        {t("reviewed")}
      </span>
    );
  }

  return (
    <div className={cn(visibility, "items-center gap-3", placement === "bar" && "justify-between")}>
      <NewUpdateMark />
      <Button
        variant="outline"
        size="sm"
        aria-busy={pending || undefined}
        onClick={() =>
          startTransition(async () => {
            setOptimisticNeedsReview(false);
            await markCaseReviewed(trackedCaseId);
          })
        }
      >
        <CheckIcon aria-hidden="true" />
        {t("markReviewed")}
      </Button>
    </div>
  );
}
