import { Skeleton } from "@/components/ui/skeleton";

/** Loading state shared by app routes: a thin progress line, a page-header ghost and a few rows. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <div className="progress-line rounded-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
