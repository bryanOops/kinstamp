import { useTranslations } from "next-intl";
import { toneFor, type StatusTone } from "@/lib/status-tone/status-tone";
import { cn } from "@/lib/utils";

const dotByTone: Record<StatusTone, string> = {
  progress: "bg-status-progress",
  action: "bg-status-action",
  approved: "bg-status-approved",
  denied: "bg-status-denied",
  unknown: "bg-status-unknown",
};

type StatusIndicatorProps = {
  /** The status title as USCIS gives it, in the current language. */
  label: string;
  /** `status_category`; missing means the case has not been checked yet. */
  category?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** A solid dot plus the status text. The tone name is announced for assistive tech. */
export function StatusIndicator({ label, category, size = "md", className }: StatusIndicatorProps) {
  const t = useTranslations("status.tone");
  const tone = toneFor(category);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-ink",
        size === "sm" && "text-sm",
        size === "md" && "text-md font-medium",
        size === "lg" && "text-heading",
        className,
      )}
    >
      <StatusDot tone={tone} size={size === "lg" ? "lg" : "md"} />
      <span className="sr-only">{t(tone)}: </span>
      <span className="min-w-0">{label}</span>
    </span>
  );
}

export function StatusDot({ tone, size = "md", className }: { tone: StatusTone; size?: "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-full", size === "lg" ? "size-3" : "size-2", dotByTone[tone], className)}
    />
  );
}
