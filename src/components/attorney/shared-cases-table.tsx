"use client";

import { BriefcaseIcon, CheckIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import { calendarDate, localizedText } from "@/components/cases/case-card";
import { daysUntil } from "@/lib/format/days";
import { EmptyState } from "@/components/status/empty-state";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusIndicator } from "@/components/status/status-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toneFor, type StatusTone } from "@/lib/status-tone/status-tone";
import { normalizeReceiptNumber } from "@/lib/format/receipt";
import { cn } from "@/lib/utils";
import { markCaseReviewed } from "@/server/actions/attorney";
import { NewUpdateMark } from "./new-update-mark";
import type { SharedCaseRow } from "./types";

type SharedCasesTableProps = {
  rows: SharedCaseRow[];
  now: Date;
  /** Email of the signed-in attorney, shown in the empty state. */
  attorneyEmail: string;
};

type ToneFilter = "all" | StatusTone;
type Sort = "urgency" | "recent";
type View = "all" | "needsReview";

const NOTHING_REVIEWED: ReadonlySet<string> = new Set();

/**
 * Filterable table of shared cases. The default order puts cases that need review first, then the
 * most urgent key date; "Mark as reviewed" clears a row at once and the server confirms it.
 */
export function SharedCasesTable({ rows, now, attorneyEmail }: SharedCasesTableProps) {
  const t = useTranslations("attorney.table");
  const toneT = useTranslations("status.tone");
  const locale = useLocale();
  const format = useFormatter();
  const searchId = useId();
  const changedId = useId();
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState<ToneFilter>("all");
  const [changedOnly, setChangedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("urgency");
  const [view, setView] = useState<View>("all");
  const [, startTransition] = useTransition();
  const [reviewedNow, addReviewed] = useOptimistic(NOTHING_REVIEWED, (current, trackedCaseId: string) => new Set(current).add(trackedCaseId));

  function markReviewed(trackedCaseId: string) {
    startTransition(async () => {
      addReviewed(trackedCaseId);
      await markCaseReviewed(trackedCaseId);
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qReceipt = normalizeReceiptNumber(query);
    return rows
      .filter((row) => {
        if (q && !row.clientName.toLowerCase().includes(q) && !(row.nickname ?? "").toLowerCase().includes(q) && !row.receiptNumber.includes(qReceipt)) return false;
        if (tone !== "all" && toneFor(row.statusCategory) !== tone) return false;
        if (changedOnly && !isRecent(row.lastChangeOn, now)) return false;
        if (view === "needsReview" && !isPendingReview(row, reviewedNow)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "urgency") {
          const ra = isPendingReview(a, reviewedNow);
          if (ra !== isPendingReview(b, reviewedNow)) return ra ? -1 : 1;
          const da = a.nextKeyDate?.date ?? "9999-12-31";
          const db = b.nextKeyDate?.date ?? "9999-12-31";
          if (da !== db) return da.localeCompare(db);
        }
        return (b.lastChangeOn ?? "").localeCompare(a.lastChangeOn ?? "");
      });
  }, [rows, query, tone, changedOnly, sort, view, reviewedNow, now]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BriefcaseIcon}
        title={t("empty.title")}
        description={
          <>
            {t("empty.description")} <span className="font-medium text-ink">{attorneyEmail}</span>
          </>
        }
      />
    );
  }

  const toneItems: Record<ToneFilter, string> = {
    all: t("allStatuses"),
    progress: toneT("progress"),
    action: toneT("action"),
    approved: toneT("approved"),
    denied: toneT("denied"),
    unknown: toneT("unknown"),
  };
  const sortItems: Record<Sort, string> = { urgency: t("sortUrgency"), recent: t("sortRecent") };
  const clients = new Set(rows.map((r) => r.clientName)).size;
  const changedThisWeek = rows.filter((r) => isRecent(r.lastChangeOn, now)).length;
  const needsReviewCount = rows.filter((row) => isPendingReview(row, reviewedNow)).length;
  const viewItems: Record<View, string> = { all: t("views.all", { count: rows.length }), needsReview: t("views.needsReview", { count: needsReviewCount }) };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{t("summary", { cases: rows.length, clients, changed: changedThisWeek })}</p>
        <div role="radiogroup" aria-label={t("views.label")} data-tour="needs-review" className="inline-flex h-11 w-full items-center rounded-lg bg-canvas-deep p-0.5 text-sm font-medium sm:h-9 sm:w-auto">
          {(Object.keys(viewItems) as View[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              onClick={() => setView(key)}
              className={cn(
                "inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-3 tabular transition-[background-color,color] duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none sm:flex-none",
                view === key ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {key === "needsReview" && needsReviewCount > 0 && <span aria-hidden="true" className="size-1.5 rounded-full bg-stamp" />}
              {viewItems[key]}
            </button>
          ))}
        </div>
      </div>

      <div data-tour="case-filters" className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-card md:flex-row md:items-center">
        <div className="relative flex-1">
          <Label htmlFor={searchId} className="sr-only">
            {t("search")}
          </Label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input id={searchId} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="h-11 pl-10 md:h-10" />
        </div>
        <Select value={tone} onValueChange={(v) => setTone(v as ToneFilter)} items={toneItems}>
          <SelectTrigger className="w-full md:h-10 md:w-48" aria-label={t("statusFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(toneItems) as ToneFilter[]).map((key) => (
              <SelectItem key={key} value={key}>
                {toneItems[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)} items={sortItems}>
          <SelectTrigger className="w-full md:h-10 md:w-44" aria-label={t("sort")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortItems) as Sort[]).map((key) => (
              <SelectItem key={key} value={key}>
                {sortItems[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor={changedId} className="flex h-11 cursor-pointer items-center gap-2.5 px-1 text-sm font-medium text-ink md:h-10">
          <Switch id={changedId} checked={changedOnly} onCheckedChange={setChangedOnly} />
          {t("changedLast7")}
        </Label>
      </div>

      {filtered.length === 0 ? (
        view === "needsReview" && needsReviewCount === 0 ? (
          <EmptyState size="inline" icon={CheckIcon} title={t("allReviewed.title")} description={t("allReviewed.description")} className="rounded-xl border border-line bg-surface" />
        ) : (
          <EmptyState size="inline" title={t("noMatches.title")} description={t("noMatches.description")} className="rounded-xl border border-line bg-surface" />
        )
      ) : (
        <>
          {/* Phones: one card per case; the table needs 880px and would only scroll sideways. */}
          <ul data-tour="shared-cases" className="flex flex-col gap-3 md:hidden">
            {filtered.map((row, index) => {
              const status = localizedText(row.status, locale);
              const awaiting = row.checkState === "awaiting_first_check" || !status;
              const recent = isRecent(row.lastChangeOn, now);
              const review = isPendingReview(row, reviewedNow);
              return (
                <li
                  key={row.shareId}
                  className="overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-expo) has-[a:hover]:border-ink-disabled has-[a:hover]:shadow-raised"
                >
                  <Link
                    href={`/attorney/cases/${row.trackedCaseId}`}
                    data-tour={index === 0 ? "shared-case-row" : undefined}
                    className="grid gap-3 rounded-xl p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-inset active:scale-[0.995]"
                  >
                    <div className="min-w-0">
                      <p className="text-subheading truncate text-ink">{row.nickname ?? row.receiptNumber}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                        <ReceiptNumber value={row.receiptNumber} size="sm" />
                        {row.formType && <span>{row.formType}</span>}
                      </p>
                    </div>
                    <p className="text-sm text-ink">
                      <span className="text-ink-muted">{t("columns.client")}: </span>
                      <span className="font-medium">{row.clientName}</span>
                    </p>
                    <StatusIndicator label={awaiting ? t("awaiting") : status} category={awaiting ? null : row.statusCategory} />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className={cn("tabular", recent ? "font-medium text-ink" : "text-ink-muted")}>
                        <span className="font-normal text-ink-muted">{t("columns.lastChange")}: </span>
                        {row.lastChangeOn ? format.dateTime(calendarDate(row.lastChangeOn), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—"}
                      </span>
                      {row.nextKeyDate && <KeyDateChip kind={row.nextKeyDate.kind} date={row.nextKeyDate.date} title={row.nextKeyDate.title} now={now} />}
                    </div>
                  </Link>
                  {review && (
                    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2">
                      <NewUpdateMark />
                      <MarkReviewedButton onClick={() => markReviewed(row.trackedCaseId)} label={t("markReviewedFor", { case: row.nickname ?? row.receiptNumber })} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

        <div data-tour="shared-cases" className="hidden overflow-x-auto rounded-xl border border-line bg-surface shadow-card md:block">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("columns.client")}</TableHead>
                <TableHead>{t("columns.case")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.lastChange")}</TableHead>
                <TableHead>{t("columns.nextKeyDate")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row, index) => {
                const status = localizedText(row.status, locale);
                const awaiting = row.checkState === "awaiting_first_check" || !status;
                const review = isPendingReview(row, reviewedNow);
                return (
                  <TableRow key={row.shareId} className="group" data-tour={index === 0 ? "shared-case-row" : undefined}>
                    <TableCell className="font-medium text-ink">{row.clientName}</TableCell>
                    <TableCell>
                      <Link
                        href={`/attorney/cases/${row.trackedCaseId}`}
                        className="block rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span className="block font-medium text-ink underline-offset-4 group-hover:underline">{row.nickname ?? row.receiptNumber}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                          <ReceiptNumber value={row.receiptNumber} size="sm" />
                          {row.formType && <span>{row.formType}</span>}
                        </span>
                        {review && <NewUpdateMark className="mt-1.5" />}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <StatusIndicator size="sm" label={awaiting ? t("awaiting") : status} category={awaiting ? null : row.statusCategory} className="max-w-[26ch]" />
                    </TableCell>
                    <TableCell className={cn("tabular text-sm", isRecent(row.lastChangeOn, now) ? "font-medium text-ink" : "text-ink-muted")}>
                      {row.lastChangeOn ? format.dateTime(calendarDate(row.lastChangeOn), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—"}
                    </TableCell>
                    <TableCell>
                      {row.nextKeyDate ? <KeyDateChip kind={row.nextKeyDate.kind} date={row.nextKeyDate.date} title={row.nextKeyDate.title} now={now} /> : <span className="text-sm text-ink-muted">—</span>}
                    </TableCell>
                    <TableCell className="w-px text-right">
                      {review && <MarkReviewedButton onClick={() => markReviewed(row.trackedCaseId)} label={t("markReviewedFor", { case: row.nickname ?? row.receiptNumber })} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </>
      )}
    </div>
  );
}

/** "Mark as reviewed" on one row; the accessible name says which case. */
function MarkReviewedButton({ onClick, label }: { onClick: () => void; label: string }) {
  const t = useTranslations("attorney.review");
  return (
    <Button variant="outline" size="xs" onClick={onClick} aria-label={label}>
      <CheckIcon aria-hidden="true" />
      {t("markReviewed")}
    </Button>
  );
}

/** Needs review per the server, unless the attorney just marked it (optimistic until the server confirms). */
function isPendingReview(row: SharedCaseRow, reviewedNow: ReadonlySet<string>): boolean {
  return row.needsReview && !reviewedNow.has(row.trackedCaseId);
}

/** Changed within the last 7 calendar days. */
function isRecent(lastChangeOn: string | null, now: Date): boolean {
  return Boolean(lastChangeOn) && daysUntil(lastChangeOn!, now) >= -7;
}
