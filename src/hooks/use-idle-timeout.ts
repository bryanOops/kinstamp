"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advance, IDLE_MS, initialIdleState, recordActivity, resetIdle, statusOf, WARNING_MS, type IdleState, type IdleStatus } from "@/lib/auth/idle";

type Options = {
  /** Called once when the warning countdown runs out. Keep it stable (`useCallback`). */
  onExpire: () => void;
  idleMs?: number;
  warningMs?: number;
};

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"] as const;

/**
 * Tracks inactivity with timestamps rather than a long timer: the status is recomputed
 * every second while the page is visible and immediately when it becomes visible again,
 * so a device that slept through the limit shows the warning on wake instead of signing
 * out silently. Activity during the warning is ignored; only `stay()` dismisses it.
 */
export function useIdleTimeout({ onExpire, idleMs = IDLE_MS, warningMs = WARNING_MS }: Options): { status: IdleStatus; stay: () => void } {
  const [status, setStatus] = useState<IdleStatus>({ kind: "active" });
  const stateRef = useRef<IdleState | null>(null);

  useEffect(() => {
    stateRef.current = initialIdleState(Date.now());
    let expired = false;

    const publish = () => {
      const now = Date.now();
      const state = advance(stateRef.current ?? initialIdleState(now), now, idleMs);
      stateRef.current = state;
      const next = statusOf(state, now, warningMs);
      setStatus((prev) => (sameStatus(prev, next) ? prev : next));
      if (next.kind === "expired" && !expired) {
        expired = true;
        onExpire();
      }
    };
    const activity = () => {
      if (stateRef.current) stateRef.current = recordActivity(stateRef.current, Date.now());
    };
    const visibility = () => {
      if (document.visibilityState === "visible") publish();
    };

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, activity, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", publish);
    const timer = window.setInterval(publish, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, activity));
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", publish);
      window.clearInterval(timer);
    };
  }, [idleMs, warningMs, onExpire]);

  const stay = useCallback(() => {
    stateRef.current = resetIdle(Date.now());
    setStatus({ kind: "active" });
  }, []);

  return { status, stay };
}

function sameStatus(a: IdleStatus, b: IdleStatus): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind !== "warning" || b.kind !== "warning" || a.secondsLeft === b.secondsLeft;
}
