"use client";

import { useSyncExternalStore } from "react";
import type { TourId } from "./tours";

/**
 * Tiny module store linking the page's `TourLauncher` with the Help button in the top
 * bar, which live in different subtrees. One tour is available at a time: the one of
 * the current page.
 */
type Registration = { tour: TourId; replay: () => void };

let current: Registration | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Called by the launcher on mount; the cleanup unregisters when the page unmounts. */
export function registerTour(tour: TourId, replay: () => void): () => void {
  const registration = { tour, replay };
  current = registration;
  emit();
  return () => {
    if (current === registration) {
      current = null;
      emit();
    }
  };
}

/** Help button: restart the tour of the current page, if it has one. */
export function replayCurrentTour() {
  current?.replay();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The tour of the current page, or `null` (server-rendered as `null`). */
export function useAvailableTour(): TourId | null {
  return useSyncExternalStore(
    subscribe,
    () => current?.tour ?? null,
    () => null,
  );
}
