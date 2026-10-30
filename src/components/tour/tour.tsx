"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { placeCard, type Box, type Size } from "@/lib/tour/steps";
import { cn } from "@/lib/utils";

export type TourStep = { id: string; target?: string; title: string; body: string };

type TourProps = {
  /** Already resolved: every anchored step has its target on the page. */
  steps: TourStep[];
  onFinish: (reason: "done" | "skip") => void;
};

/** Breathing room between the target and the cutout edge. */
const CUTOUT_PADDING = 6;
/** Below this width (Tailwind `sm`) the card is a bottom sheet instead of a popover. */
const SHEET_BREAKPOINT = 640;
/** Vermilion ring on the cutout, then the shade over everything else (both are box-shadows, so they live together). */
const SHADE = "0 0 0 2px var(--color-stamp), 0 0 0 200vmax rgb(11 11 15 / 0.55)";

/** First *visible* element with that `data-tour` value: the nav is rendered twice (desktop row, phone row). */
export function findTarget(target: string | undefined): HTMLElement | null {
  if (!target) return null;
  for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)) {
    if (element.getClientRects().length > 0) return element;
  }
  return null;
}

/**
 * Spotlight tour: a shade with a cutout around the current target, and a card with the
 * step's title, body, counter and controls. Esc skips, arrows move, Tab stays inside the
 * card. The cutout follows the target on scroll and resize; on phones the card sits at
 * the bottom so the target stays visible above it.
 */
export function Tour({ steps, onFinish }: TourProps) {
  const t = useTranslations("tour");
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<Box | null>(null);
  const [viewport, setViewport] = useState<Size | null>(null);
  const [cardSize, setCardSize] = useState<Size | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const step = steps[index];
  const last = index === steps.length - 1;
  const targetId = step?.target;

  // Bring the target into view and keep its box current while the page moves or reflows.
  useLayoutEffect(() => {
    const element = findTarget(targetId);
    const measure = () => {
      setTarget(element ? toBox(element.getBoundingClientRect()) : null);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    if (element) scrollToTarget(element);
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, { capture: true });
    };
  }, [index, targetId]);

  // The card's own size decides where it fits; it changes with the step's copy.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(() => {
      // Border box (contentRect would leave the padding out of the placement maths).
      const { width, height } = card.getBoundingClientRect();
      setCardSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Focus moves into the card and returns to the opener (e.g. the Help button) when the tour ends.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    primaryRef.current?.focus();
    return () => opener?.focus();
  }, []);

  if (!step) return null;

  const sheet = viewport ? viewport.width < SHEET_BREAKPOINT : true;
  const position = !sheet && viewport && cardSize ? placeCard(target, cardSize, viewport) : null;

  const next = () => (last ? onFinish("done") : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onFinish("skip");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
    } else if (event.key === "Tab") {
      trapFocus(event, cardRef.current);
    }
  }

  // Portal to <body>: the page entrance (`fade-up`) leaves a transform on the content wrapper,
  // which would turn it into the containing block of these fixed layers.
  return createPortal(
    // The root catches every click, so the page underneath stays put while the tour runs.
    <div className="fixed inset-0 z-50 animate-in fade-in-0 duration-(--duration-base)" role="presentation">
      {target ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-xl transition-[top,left,width,height] duration-(--duration-slow) ease-(--ease-out-expo)"
          style={{
            top: target.top - CUTOUT_PADDING,
            left: target.left - CUTOUT_PADDING,
            width: target.width + CUTOUT_PADDING * 2,
            height: target.height + CUTOUT_PADDING * 2,
            boxShadow: SHADE,
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-ink/55" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={onKeyDown}
        className={cn(
          "fixed flex flex-col gap-2 bg-surface p-5 text-ink shadow-overlay outline-none",
          sheet
            ? "inset-x-0 bottom-0 rounded-t-2xl pb-[max(--spacing(5),var(--safe-bottom))]"
            : "w-[22.5rem] rounded-2xl transition-[top,left] duration-(--duration-slow) ease-(--ease-out-expo)",
          !sheet && !position && "invisible",
        )}
        style={position ?? undefined}
      >
        <p className="text-caps text-ink-muted">{t("step", { current: index + 1, total: steps.length })}</p>
        <h2 id={titleId} className="text-heading">
          {step.title}
        </h2>
        <p id={bodyId} className="text-md text-ink-muted">
          {step.body}
        </p>
        <p aria-live="polite" className="sr-only">
          {t("announce", { current: index + 1, total: steps.length, title: step.title })}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button variant="link" className="text-sm text-ink-muted hover:text-ink" onClick={() => onFinish("skip")}>
            {t("skip")}
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={back}>
                {t("back")}
              </Button>
            )}
            <Button ref={primaryRef} size="sm" onClick={next}>
              {last ? t("done") : t("next")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function toBox(rect: DOMRect): Box {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/**
 * Tall targets (a whole card) and phone screens (card at the bottom) read best from the top,
 * just under the sticky bar (`--header-offset`); otherwise the target is centered.
 */
function scrollToTarget(element: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
  const rect = element.getBoundingClientRect();
  const tall = rect.height > window.innerHeight * 0.5;
  if (!tall && window.innerWidth >= SHEET_BREAKPOINT) {
    element.scrollIntoView({ block: "center", behavior });
    return;
  }
  const root = getComputedStyle(document.documentElement);
  const headerOffset = parseFloat(root.getPropertyValue("--header-offset")) * parseFloat(root.fontSize) || 0;
  window.scrollBy({ top: rect.top - headerOffset - 16, behavior });
}

/** Keeps Tab / Shift+Tab cycling inside the card. */
function trapFocus(event: KeyboardEvent<HTMLDivElement>, card: HTMLDivElement | null) {
  if (!card) return;
  const focusable = card.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const final = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    final.focus();
  } else if (!event.shiftKey && document.activeElement === final) {
    event.preventDefault();
    first.focus();
  }
}
