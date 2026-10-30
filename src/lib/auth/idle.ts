/**
 * Idle-session state: pure functions over timestamps, so the hook that drives the
 * "Still there?" dialog only has to call them from timers and activity events.
 *
 * The warning countdown starts when the idle limit is *noticed*, not when it was
 * reached: a laptop that slept for an hour wakes up to the dialog with a full minute,
 * instead of being signed out before anyone could react.
 */

export const IDLE_MS = 30 * 60_000;
export const WARNING_MS = 60_000;

export type IdleState = {
  lastActiveAt: number;
  /** When the warning dialog opened; `null` while the person is active. */
  warningStartedAt: number | null;
};

export type IdleStatus = { kind: "active" } | { kind: "warning"; secondsLeft: number } | { kind: "expired" };

export function initialIdleState(now: number): IdleState {
  return { lastActiveAt: now, warningStartedAt: null };
}

/** Pointer, keyboard or touch activity. Ignored once the warning is showing: only "Stay signed in" dismisses it. */
export function recordActivity(state: IdleState, now: number): IdleState {
  if (state.warningStartedAt !== null) return state;
  return { ...state, lastActiveAt: now };
}

/** Called on every tick and when the page becomes visible: opens the warning once the idle limit has passed. */
export function advance(state: IdleState, now: number, idleMs = IDLE_MS): IdleState {
  if (state.warningStartedAt !== null) return state;
  if (now - state.lastActiveAt < idleMs) return state;
  return { ...state, warningStartedAt: now };
}

export function statusOf(state: IdleState, now: number, warningMs = WARNING_MS): IdleStatus {
  if (state.warningStartedAt === null) return { kind: "active" };
  const remaining = warningMs - (now - state.warningStartedAt);
  if (remaining <= 0) return { kind: "expired" };
  return { kind: "warning", secondsLeft: Math.ceil(remaining / 1000) };
}

/** "Stay signed in": the person is back, start counting from now. */
export function resetIdle(now: number): IdleState {
  return initialIdleState(now);
}
