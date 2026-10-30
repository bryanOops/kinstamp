import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** `page` is the roomy variant for whole-route empties; `inline` sits inside a card or table. */
  size?: "page" | "inline";
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, size = "page", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        size === "page" ? "rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 sm:py-20" : "px-4 py-10",
        className,
      )}
    >
      {Icon && (
        <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-line bg-surface text-ink shadow-card">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h2 className={cn("text-ink", size === "page" ? "text-heading" : "text-subheading")}>{title}</h2>
      {description && <p className="mt-2 max-w-[44ch] text-md text-ink-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
