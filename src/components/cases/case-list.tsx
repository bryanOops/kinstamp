import { FolderOpenIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/status/empty-state";
import { daysUntil } from "@/lib/format/days";
import { CaseCard } from "./case-card";
import type { TrackedCaseSummary } from "./types";

type CaseListProps = {
  cases: TrackedCaseSummary[];
  now: Date;
  /** Rendered in the empty state. */
  addCaseAction?: ReactNode;
};

export function CaseList({ cases, now, addCaseAction }: CaseListProps) {
  const t = useTranslations("cases.list");
  const format = useFormatter();

  if (cases.length === 0) {
    return <EmptyState icon={FolderOpenIcon} title={t("empty.title")} description={t("empty.description")} action={addCaseAction} />;
  }

  const changedThisWeek = cases.filter((c) => c.lastChangeOn && daysUntil(c.lastChangeOn, now) >= -7).length;
  const lastChecked = cases
    .map((c) => c.lastSuccessfulCheckAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        {t("summary", { count: cases.length, changed: changedThisWeek })}
        {lastChecked && (
          <>
            {" · "}
            {t("lastChecked", { time: format.relativeTime(new Date(lastChecked), now) })}
          </>
        )}
      </p>
      <ul className="flex flex-col gap-3">
        {cases.map((tracked) => (
          <li key={tracked.trackedCaseId}>
            <CaseCard tracked={tracked} now={now} />
          </li>
        ))}
      </ul>
    </div>
  );
}
