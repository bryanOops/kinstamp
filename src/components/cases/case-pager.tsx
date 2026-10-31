"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CasePagerProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Smaller, quieter copy for the list header; the full one sits under the list. */
  compact?: boolean;
  className?: string;
};

/** "Page 1 of 2" between previous/next arrows. The caller hides it when there is one page. */
export function CasePager({ page, pageCount, onChange, compact = false, className }: CasePagerProps) {
  const t = useTranslations("cases.pager");

  return (
    <nav aria-label={t("label")} className={cn("flex items-center", compact ? "gap-1" : "justify-center gap-3", className)}>
      <Button
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon-xs" : "icon-sm"}
        aria-label={t("previous")}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeftIcon aria-hidden="true" />
      </Button>
      {/* Only the full pager announces, so a page change is read once even with two pagers on screen. */}
      <p className={cn("tabular text-sm text-ink-muted", compact && "min-w-[6ch] text-center")} aria-live={compact ? undefined : "polite"}>
        {t("pageOf", { page, total: pageCount })}
      </p>
      <Button
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon-xs" : "icon-sm"}
        aria-label={t("next")}
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRightIcon aria-hidden="true" />
      </Button>
    </nav>
  );
}
