import type { TourStepDefinition } from "@/lib/tour/steps";

/** One tour per screen. The id is stored in `profiles.tours_completed` once finished or skipped. */
export const tourIds = ["cases", "attorney", "case_detail"] as const;
export type TourId = (typeof tourIds)[number];

export function isTourId(value: unknown): value is TourId {
  return typeof value === "string" && (tourIds as readonly string[]).includes(value);
}

/**
 * Steps per tour. `id` maps to `tour.<tourId>.<id>.title|body` in the messages;
 * `target` is the `data-tour` attribute of the element to spotlight. Steps whose
 * target is not on the page (empty state, other role) are skipped at runtime.
 */
export const tours: Record<TourId, readonly TourStepDefinition[]> = {
  cases: [
    { id: "welcome" },
    { id: "addCase", target: "add-case" },
    { id: "caseCard", target: "case-card" },
    { id: "insights", target: "nav-insights" },
    { id: "account", target: "account-menu" },
  ],
  attorney: [
    { id: "welcome" },
    { id: "table", target: "shared-cases" },
    { id: "filters", target: "case-filters" },
    { id: "row", target: "shared-case-row" },
  ],
  case_detail: [
    { id: "status", target: "status-hero" },
    { id: "timeline", target: "timeline" },
    { id: "keyDates", target: "key-dates" },
    { id: "share", target: "share" },
    { id: "assistant", target: "assistant" },
  ],
};
