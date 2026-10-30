import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Danger-zone styling: destructive outline on the content card. */
  tone?: "default" | "danger";
  className?: string;
};

/** Two-column settings block: heading on the left, a card of rows on the right. */
export function SettingsSection({ title, description, children, tone = "default", className }: SettingsSectionProps) {
  return (
    <section className={cn("grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10", className)}>
      <div>
        <h2 className={cn("text-heading", tone === "danger" ? "text-destructive" : "text-ink")}>{title}</h2>
        {description && <p className="mt-1.5 max-w-[36ch] text-sm text-ink-muted">{description}</p>}
      </div>
      <div
        className={cn(
          "divide-y divide-line rounded-xl border bg-surface shadow-card",
          tone === "danger" ? "border-destructive/40" : "border-line",
        )}
      >
        {children}
      </div>
    </section>
  );
}

type SettingsRowProps = {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  /** Id of the control, to tie the label to it. */
  htmlFor?: string;
  className?: string;
};

export function SettingsRow({ label, hint, children, htmlFor, className }: SettingsRowProps) {
  const LabelTag = htmlFor ? "label" : "div";
  return (
    <div className={cn("flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6", className)}>
      <LabelTag htmlFor={htmlFor} className="min-w-0">
        <span className="block text-md font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-ink-muted">{hint}</span>}
      </LabelTag>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  );
}
