"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EmptyState } from "@/components/status/empty-state";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { paginate, parsePage } from "@/lib/cases/paging";
import { matchesCaseQuery, type CaseSearchable } from "@/lib/cases/search";
import { CasePager } from "./case-pager";
import { CaseSearch } from "./case-search";

export const CASE_PAGE_SIZE = 5;
export const SEARCH_DEBOUNCE_MS = 150;

type PagedCase = {
  id: string;
  /** The card, rendered by the server so this leaf only decides which ones are on screen. */
  card: ReactNode;
  /** What the search looks at; the card itself is opaque here. */
  searchable: CaseSearchable;
};

type PagedCaseListProps = {
  cases: PagedCase[];
  /** The "N cases · …" line. It heads the list and shares its row with the compact pager. */
  summary: ReactNode;
  pageSize?: number;
};

/** `none` is a fade in place, used when the result set changes without changing page. */
type Direction = "forward" | "backward" | "none";

type View = {
  /** Ids of the cards on screen. Same ids means nothing to swap, however the URL changed. */
  signature: string;
  query: string;
  page: number;
  /** Bumped on every swap so both lists remount even if an animation is still running. */
  generation: number;
  /** `null` on the first paint: the page entrance is the one entrance per screen. */
  direction: Direction | null;
  items: PagedCase[];
  /** Cards of the view just left, kept on screen while they fade out. */
  outgoing: PagedCase[] | null;
};

/**
 * Pages of `CaseCard`s, 5 per page, filtered by a free-text search. Query (`?q=`) and page
 * (`?page=2`) live in the URL so refresh and history keep them, and are written with the native
 * History API, which Next syncs with `useSearchParams` without a server round trip. A query
 * change goes back to page 1; out-of-range pages clamp (see `paginate`).
 */
export function PagedCaseList({ cases, summary, pageSize = CASE_PAGE_SIZE }: PagedCaseListProps) {
  const t = useTranslations("cases.search");
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const requested = parsePage(searchParams.get("page"));
  const matching = query ? cases.filter((tracked) => matchesCaseQuery(query, tracked.searchable)) : cases;
  const { page, pageCount, items } = paginate(matching, requested, pageSize);
  const signature = items.map((tracked) => tracked.id).join("|");
  const listRef = useRef<HTMLDivElement>(null);

  // Remember what was on screen so the swap animates in the direction of travel.
  const [view, setView] = useState<View>({ signature, query, page, generation: 0, direction: null, items, outgoing: null });
  if (view.signature !== signature) {
    const direction: Direction = query !== view.query || page === view.page ? "none" : page > view.page ? "forward" : "backward";
    setView({ signature, query, page, generation: view.generation + 1, direction, items, outgoing: view.items });
  }

  // The field keeps its own draft; the URL gets the query once typing pauses.
  const [draft, setDraft] = useState(query);
  const [commitSearch, cancelSearch] = useDebouncedCallback(search, SEARCH_DEBOUNCE_MS);

  function writeUrl(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const next = params.toString();
    window.history.replaceState(null, "", next ? `?${next}` : window.location.pathname);
  }

  function goTo(next: number) {
    writeUrl((params) => {
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
    });

    // From the pager under a long page, bring the list top back into view; never jump otherwise.
    const list = listRef.current;
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function search(next: string) {
    writeUrl((params) => {
      params.delete("page");
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
    });
  }

  function clearSearch() {
    cancelSearch();
    setDraft("");
    search("");
  }

  const paged = pageCount > 1;

  return (
    <div id="case-list" ref={listRef} className="flex flex-col gap-4">
      <CaseSearch
        value={draft}
        onChange={(value) => {
          setDraft(value);
          commitSearch(value);
        }}
        onClear={clearSearch}
        className="w-full sm:max-w-[360px]"
      />

      <div className="flex min-h-9 items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
          {summary}
          {query && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <p role="status" className="w-full font-medium text-ink sm:w-auto">
                {t("matches", { count: matching.length, total: cases.length })}
              </p>
            </>
          )}
        </div>
        {paged && <CasePager compact page={page} pageCount={pageCount} onChange={goTo} className="hidden shrink-0 sm:flex" />}
      </div>

      {/* Both lists share one grid cell, so the leaving page fades over the entering one without moving the pager. */}
      <div className="grid">
        {view.outgoing && view.outgoing.length > 0 && (
          <ul
            key={`out-${view.generation}`}
            className="case-page col-start-1 row-start-1 flex flex-col gap-3"
            data-direction={view.direction ?? undefined}
            data-leaving=""
            aria-hidden="true"
            inert
            onAnimationEnd={() => setView((v) => ({ ...v, outgoing: null }))}
          >
            {view.outgoing.map((tracked) => (
              <li key={tracked.id}>{tracked.card}</li>
            ))}
          </ul>
        )}
        {items.length === 0 ? (
          <div key={`in-${view.generation}`} className="case-page col-start-1 row-start-1" data-direction={view.direction ?? undefined}>
            <EmptyState
              size="inline"
              title={t("noMatches.title", { query })}
              description={t("noMatches.description")}
              action={
                <Button type="button" variant="outline" onClick={clearSearch}>
                  {t("noMatches.clear")}
                </Button>
              }
              className="rounded-xl border border-line bg-surface"
            />
          </div>
        ) : (
          <ul key={`in-${view.generation}`} className="case-page col-start-1 row-start-1 flex flex-col gap-3" data-direction={view.direction ?? undefined}>
            {items.map((tracked, index) => (
              <li key={tracked.id} style={{ "--index": index } as CSSProperties}>
                {tracked.card}
              </li>
            ))}
          </ul>
        )}
      </div>

      {paged && <CasePager page={page} pageCount={pageCount} onChange={goTo} className="pt-2" />}
    </div>
  );
}
