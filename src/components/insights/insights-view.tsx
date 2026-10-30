"use client";

import { ChartNoAxesColumnIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { InsightSummary } from "@/components/cases/types";
import { EmptyState } from "@/components/status/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil } from "@/lib/format/days";
import { cn } from "@/lib/utils";

export type OwnCase = { trackedCaseId: string; nickname: string | null; formType: string | null; receivedOn: string | null };

type InsightsViewProps = {
  insights: InsightSummary[];
  ownCases: OwnCase[];
  now: Date;
};

/** Per form type: median and 25–75% range of days from received to approved, with the client's own cases marked. */
export function InsightsView({ insights, ownCases, now }: InsightsViewProps) {
  const t = useTranslations("insights.view");
  const [selected, setSelected] = useState(insights[0]?.formType ?? null);
  const current = insights.find((i) => i.formType === selected) ?? null;

  if (insights.length === 0 || !current) {
    return <EmptyState icon={ChartNoAxesColumnIcon} title={t("empty.title")} description={t("empty.description")} />;
  }

  const own = ownCases.filter((c) => c.formType === current.formType && c.receivedOn);
  const ownDays = own.map((c) => ({ ...c, days: -daysUntil(c.receivedOn!, now) }));
  const scaleMax = Math.max(current.p75Days * 1.3, ...ownDays.map((c) => c.days * 1.15));
  const pct = (days: number) => Math.min(100, (days / scaleMax) * 100);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((scaleMax * f) / 30) * 30);

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={t("formTypes")} className="flex flex-wrap gap-2">
        {insights.map((insight) => {
          const active = insight.formType === current.formType;
          const mine = ownCases.filter((c) => c.formType === insight.formType).length;
          return (
            <button
              key={insight.formType}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setSelected(insight.formType)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink-disabled",
              )}
            >
              {insight.formType}
              {mine > 0 && (
                <span className={cn("rounded-md px-1.5 py-0.5 text-xs", active ? "bg-white/15 text-white" : "bg-stamp-tint text-stamp-ink")}>
                  {t("yours", { count: mine })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-heading">{t("chartTitle", { form: current.formType })}</CardTitle>
          <p className="text-sm text-ink-muted">{t("chartSubtitle")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={t("median")} value={t("days", { days: current.medianDays })} />
            <Stat label={t("p25")} value={t("days", { days: current.p25Days })} />
            <Stat label={t("p75")} value={t("days", { days: current.p75Days })} />
            <Stat label={t("cases")} value={String(current.count)} />
          </dl>

          <figure>
            <div className="relative h-16" aria-hidden="true">
              <div className="absolute inset-x-0 top-7 h-2.5 rounded-full bg-line" />
              <div className="absolute top-7 h-2.5 rounded-full bg-ink/85" style={{ left: `${pct(current.p25Days)}%`, width: `${pct(current.p75Days) - pct(current.p25Days)}%` }} />
              <div className="absolute top-5 h-6 w-0.5 bg-ink" style={{ left: `${pct(current.medianDays)}%` }} />
              {ownDays.map((c) => (
                <div key={c.trackedCaseId} className="absolute top-6 -translate-x-1/2" style={{ left: `${pct(c.days)}%` }}>
                  <span className="block size-4 rounded-full border-2 border-surface bg-stamp shadow-card" />
                </div>
              ))}
              <div className="absolute inset-x-0 top-12 flex justify-between text-xs tabular text-ink-muted">
                {ticks.map((tick) => (
                  <span key={tick}>{t("days", { days: tick })}</span>
                ))}
              </div>
            </div>
            <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-2 w-4 rounded-full bg-ink/85" />
                {t("legendRange")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-0.5 bg-ink" />
                {t("legendMedian")}
              </span>
              {ownDays.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-stamp" />
                  {t("legendYours")}
                </span>
              )}
            </figcaption>
          </figure>

          {ownDays.length > 0 && (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {ownDays.map((c) => (
                <li key={c.trackedCaseId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium text-ink">{c.nickname ?? c.trackedCaseId}</span>
                  <span className="tabular text-ink-muted">{t("soFar", { days: c.days })}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-ink-subtle">{t("basis", { count: current.count })}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas/60 px-4 py-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular text-ink">{value}</dd>
    </div>
  );
}
