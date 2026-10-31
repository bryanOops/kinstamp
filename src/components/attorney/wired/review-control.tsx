"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { NewUpdateMark } from "@/components/attorney/new-update-mark";
import { Button } from "@/components/ui/button";
import { markCaseReviewed } from "@/server/actions/attorney";

type ReviewControlProps = {
  trackedCaseId: string;
  /** From src/lib/attorney/review.ts, computed on the server. */
  needsReview: boolean;
};

/**
 * Case detail header action for attorneys: "New update" + "Mark as reviewed" while the case has a
 * status event the attorney has not reviewed; a quiet "Reviewed" once it is cleared. Rendered once,
 * in the page header at every width: on phones the button is icon-only so the title keeps its room.
 * Opening the case never marks it.
 */
export function ReviewControl({ trackedCaseId, needsReview }: ReviewControlProps) {
  const t = useTranslations("attorney.review");
  const [pending, startTransition] = useTransition();
  const [optimisticNeedsReview, setOptimisticNeedsReview] = useOptimistic(needsReview);

  if (!optimisticNeedsReview) {
    return (
      <span role="status" className="flex h-11 items-center gap-1.5 text-sm text-ink-muted sm:h-9">
        <CheckIcon className="size-4" aria-hidden="true" />
        {t("reviewed")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <NewUpdateMark />
      <Button
        variant="outline"
        size="sm"
        aria-label={t("markReviewed")}
        className="max-sm:w-11 max-sm:px-0"
        aria-busy={pending || undefined}
        onClick={() =>
          startTransition(async () => {
            setOptimisticNeedsReview(false);
            await markCaseReviewed(trackedCaseId);
          })
        }
      >
        <CheckIcon aria-hidden="true" />
        <span className="max-sm:sr-only">{t("markReviewed")}</span>
      </Button>
    </div>
  );
}
