import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Quiet "needs review" marker for a shared case: a vermilion dot plus the words, never the color alone. */
export function NewUpdateMark({ className }: { className?: string }) {
  const t = useTranslations("attorney.review");
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold text-stamp-ink", className)}>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-stamp" />
      {t("newUpdate")}
    </span>
  );
}
