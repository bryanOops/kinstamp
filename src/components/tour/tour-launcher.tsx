"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { resolveSteps } from "@/lib/tour/steps";
import { markTourCompleted } from "@/server/actions/profile";
import { findTarget, Tour, type TourStep } from "./tour";
import { registerTour } from "./tour-store";
import { tours, type TourId } from "./tours";

type TourLauncherProps = {
  tour: TourId;
  /** From `profile.toursCompleted`: a finished or skipped tour never auto-starts again. */
  completed: boolean;
};

/** Lets the page paint and settle (entrance animation, streamed top bar) before the spotlight appears. */
const AUTO_START_DELAY_MS = 700;

/**
 * Mounted once per screen that has a tour. Auto-starts the tour the first time the
 * account sees the screen and registers it so the Help button can replay it.
 * Finishing or skipping records the tour on the profile.
 */
export function TourLauncher({ tour, completed }: TourLauncherProps) {
  const t = useTranslations(`tour.${tour}`);
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [recorded, setRecorded] = useState(completed);
  const [, startTransition] = useTransition();

  const start = useCallback(() => {
    const present = resolveSteps(tours[tour], (target) => findTarget(target) !== null);
    setSteps(present.map((step) => ({ ...step, title: t(`${step.id}.title`), body: t(`${step.id}.body`) })));
  }, [tour, t]);

  useEffect(() => registerTour(tour, start), [tour, start]);

  useEffect(() => {
    if (recorded) return;
    const timer = window.setTimeout(start, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [recorded, start]);

  function finish() {
    setSteps(null);
    if (recorded) return;
    setRecorded(true);
    startTransition(() => markTourCompleted(tour));
  }

  if (!steps) return null;
  return <Tour steps={steps} onFinish={finish} />;
}
