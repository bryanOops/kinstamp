/** Reads a `?page=` value. Anything that is not a positive integer means the first page. */
export function parsePage(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return page >= 1 ? page : 1;
}

export type Page<T> = {
  /** The page actually shown, after clamping. */
  page: number;
  pageCount: number;
  items: T[];
};

/**
 * One page of `items`. Out-of-range pages clamp to the nearest valid one, so a page that
 * empties out (a case was removed) falls back to the last page instead of showing nothing.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return { page: current, pageCount, items: items.slice(start, start + pageSize) };
}
