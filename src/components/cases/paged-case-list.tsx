"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { paginate, parsePage } from "@/lib/cases/paging";
import { CasePager } from "./case-pager";

export const CASE_PAGE_SIZE = 8;

type PagedCase = {
  id: string;
  /** The card, rendered by the server so this leaf only decides which ones are on screen. */
  card: ReactNode;
};

type PagedCaseListProps = {
  cases: PagedCase[];
  /** The "N cases · …" line. It heads the list and shares its row with the compact pager. */
  summary: ReactNode;
  pageSize?: number;
};

type Direction = "forward" | "backward";

type Swap = {
  page: number;
  /** `null` on the first paint: the page entrance is the one entrance per screen. */
  direction: Direction | null;
  /** Cards of the page just left, kept on screen while they fade out. */
  outgoing: { page: number; cases: PagedCase[] } | null;
};

/**
 * Pages of `CaseCard`s, 8 per page. The current page lives in the URL (`?page=2`) so refresh
 * and history keep it, and is written with the native History API, which Next syncs with
 * `useSearchParams` without a server round trip. Out-of-range pages clamp (see `paginate`).
 */
export function PagedCaseList({ cases, summary, pageSize = CASE_PAGE_SIZE }: PagedCaseListProps) {
  const searchParams = useSearchParams();
  const requested = parsePage(searchParams.get("page"));
  const { page, pageCount, items } = paginate(cases, requested, pageSize);
  const listRef = useRef<HTMLDivElement>(null);

  // Remember where we came from so the swap animates in the direction of travel.
  const [swap, setSwap] = useState<Swap>({ page, direction: null, outgoing: null });
  if (swap.page !== page) {
    setSwap({
      page,
      direction: page > swap.page ? "forward" : "backward",
      outgoing: { page: swap.page, cases: paginate(cases, swap.page, pageSize).items },
    });
  }

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);

    // From the pager under a long page, bring the list top back into view; never jump otherwise.
    const list = listRef.current;
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const paged = pageCount > 1;

  return (
    <div id="case-list" ref={listRef} className="flex flex-col gap-4">
      <div className="flex min-h-9 items-center justify-between gap-4">
        {summary}
        {paged && <CasePager compact page={page} pageCount={pageCount} onChange={goTo} className="hidden shrink-0 sm:flex" />}
      </div>

      {/* Both lists share one grid cell, so the leaving page fades over the entering one without moving the pager. */}
      <div className="grid">
        {swap.outgoing && (
          <ul
            key={`out-${swap.outgoing.page}`}
            className="case-page col-start-1 row-start-1 flex flex-col gap-3"
            data-direction={swap.direction ?? undefined}
            data-leaving=""
            aria-hidden="true"
            inert
            onAnimationEnd={() => setSwap((s) => ({ ...s, outgoing: null }))}
          >
            {swap.outgoing.cases.map((tracked) => (
              <li key={tracked.id}>{tracked.card}</li>
            ))}
          </ul>
        )}
        <ul key={page} className="case-page col-start-1 row-start-1 flex flex-col gap-3" data-direction={swap.direction ?? undefined}>
          {items.map((tracked, index) => (
            <li key={tracked.id} style={{ "--index": index } as CSSProperties}>
              {tracked.card}
            </li>
          ))}
        </ul>
      </div>

      {paged && <CasePager page={page} pageCount={pageCount} onChange={goTo} className="pt-2" />}
    </div>
  );
}
