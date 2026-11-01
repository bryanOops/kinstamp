import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Shown above the title; the last crumb is the current page. */
  breadcrumbs?: Crumb[];
  /** Line under the title (e.g. receipt number and form type). */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, breadcrumbs, meta, actions, className }: PageHeaderProps) {
  const t = useTranslations("nav");
  return (
    // Title and actions share one row at every width: on phones the action sits top-right, next to the title.
    <header className={cn("flex items-start justify-between gap-4 sm:items-end", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label={t("breadcrumbLabel")} className="mb-3">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="inline-flex min-h-8 items-center rounded-sm hover:text-ink hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "text-ink")}>
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && <ChevronRightIcon className="size-3.5 text-ink-disabled" aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="text-title text-ink">{title}</h1>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">{meta}</div>}
        {description && <p className="mt-2 max-w-[60ch] text-md text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </header>
  );
}
