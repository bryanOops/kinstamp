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
  /**
   * True only on a role's main screen while the tour is not in `profile.toursCompleted`.
   * Otherwise the tour runs only from the Help button.
   */
  autoStart: boolean;
};

/** Lets the page paint and settle (entrance animation, streamed top bar) before the spotlight appears. */
const AUTO_START_DELAY_MS = 700;

/**
 * Mounted once per screen that has a tour and registers it so the Help button can replay it.
 * The main screen of each role auto-starts its tour once per account: it is recorded on the
 * profile as soon as it starts, so leaving halfway (navigating, closing the tab, signing out)
 * does not bring it back.
 */
export function TourLauncher({ tour, autoStart }: TourLauncherProps) {
  const t = useTranslations(`tour.${tour}`);
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [recorded, setRecorded] = useState(!autoStart);
  const [, startTransition] = useTransition();

  const start = useCallback(() => {
    const present = resolveSteps(tours[tour], (target) => findTarget(target) !== null);
    setSteps(present.map((step) => ({ ...step, title: t(`${step.id}.title`), body: t(`${step.id}.body`) })));
  }, [tour, t]);

  useEffect(() => registerTour(tour, start), [tour, start]);

  useEffect(() => {
    if (recorded) return;
    const timer = window.setTimeout(() => {
      setRecorded(true);
      startTransition(() => markTourCompleted(tour));
      start();
    }, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [recorded, start, tour]);

  const finish = () => setSteps(null);

  if (!steps) return null;
  return <Tour steps={steps} onFinish={finish} />;
}
