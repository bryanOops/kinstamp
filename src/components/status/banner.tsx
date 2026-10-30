import { AlertTriangleIcon, InfoIcon, OctagonAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "warning" | "error";

const styles: Record<BannerVariant, { icon: typeof InfoIcon; iconColor: string; rail: string }> = {
  info: { icon: InfoIcon, iconColor: "text-status-progress", rail: "before:bg-status-progress" },
  warning: { icon: AlertTriangleIcon, iconColor: "text-status-action", rail: "before:bg-status-action" },
  error: { icon: OctagonAlertIcon, iconColor: "text-status-denied", rail: "before:bg-status-denied" },
};

type BannerProps = {
  variant?: BannerVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Page-level notice, e.g. "USCIS is offline. Showing the last saved status from …".
 * White surface with a 1px status rail on the left; the icon carries the tone too.
 */
export function Banner({ variant = "info", title, description, action, className }: BannerProps) {
  const { icon: Icon, iconColor, rail } = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-line bg-surface py-3.5 pr-4 pl-5 shadow-card sm:flex-row sm:items-center sm:gap-4",
        "before:absolute before:inset-y-0 before:left-0 before:w-px",
        rail,
        className,
      )}
    >
      <Icon className={cn("size-5 shrink-0", iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-md font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
