/**
 * Pure helpers for the guided tour: which steps to show and where to put the card.
 * The component in `src/components/tour/` does the DOM work and calls these.
 */

export type TourStepDefinition = {
  id: string;
  /** `data-tour` value of the element to spotlight; unanchored steps are centered. */
  target?: string;
};

export type Box = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Point = { top: number; left: number };

/** Drops anchored steps whose target is not on the page (empty states, other roles). */
export function resolveSteps<T extends TourStepDefinition>(steps: readonly T[], isPresent: (target: string) => boolean): T[] {
  return steps.filter((step) => !step.target || isPresent(step.target));
}

const GAP = 12;
const MARGIN = 16;

/**
 * Card position on desktop: below the target, else above, else beside it, always
 * inside the viewport. Without a target the card is centered.
 */
export function placeCard(target: Box | null, card: Size, viewport: Size): Point {
  if (!target) return { top: (viewport.height - card.height) / 2, left: (viewport.width - card.width) / 2 };

  const clampLeft = (left: number) => Math.max(MARGIN, Math.min(left, viewport.width - MARGIN - card.width));
  const clampTop = (top: number) => Math.max(MARGIN, Math.min(top, viewport.height - MARGIN - card.height));

  const below = target.top + target.height + GAP;
  if (below + card.height <= viewport.height - MARGIN) return { top: below, left: clampLeft(target.left) };

  const above = target.top - GAP - card.height;
  if (above >= MARGIN) return { top: above, left: clampLeft(target.left) };

  const right = target.left + target.width + GAP;
  if (right + card.width <= viewport.width - MARGIN) return { top: clampTop(target.top), left: right };

  const left = target.left - GAP - card.width;
  if (left >= MARGIN) return { top: clampTop(target.top), left };

  return { top: clampTop(below), left: clampLeft(target.left) };
}
