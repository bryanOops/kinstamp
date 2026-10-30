import { describe, expect, it } from "vitest";
import { advance, IDLE_MS, initialIdleState, recordActivity, resetIdle, statusOf, WARNING_MS } from "./idle";

const t0 = 1_700_000_000_000;
const minutes = (n: number) => n * 60_000;

describe("idle session state", () => {
  it("is active while the person keeps using the app", () => {
    const state = recordActivity(initialIdleState(t0), t0 + minutes(29));
    expect(statusOf(advance(state, t0 + minutes(45)), t0 + minutes(45))).toEqual({ kind: "active" });
  });

  it("starts a 60-second warning after 30 minutes without activity", () => {
    const state = advance(initialIdleState(t0), t0 + IDLE_MS);
    expect(statusOf(state, t0 + IDLE_MS)).toEqual({ kind: "warning", secondsLeft: 60 });
    expect(statusOf(state, t0 + IDLE_MS + 59_500)).toEqual({ kind: "warning", secondsLeft: 1 });
  });

  it("expires once the warning runs out", () => {
    const state = advance(initialIdleState(t0), t0 + IDLE_MS);
    expect(statusOf(state, t0 + IDLE_MS + WARNING_MS)).toEqual({ kind: "expired" });
  });

  it("ignores pointer and keyboard activity while the warning is showing", () => {
    const warned = advance(initialIdleState(t0), t0 + IDLE_MS);
    const touched = recordActivity(warned, t0 + IDLE_MS + 10_000);
    expect(statusOf(touched, t0 + IDLE_MS + 10_000)).toEqual({ kind: "warning", secondsLeft: 50 });
  });

  it("shows the warning with a full countdown when the device wakes after a long sleep", () => {
    // Laptop closed at t0, reopened an hour later: no timer fired in between.
    const woke = advance(initialIdleState(t0), t0 + minutes(60));
    expect(statusOf(woke, t0 + minutes(60))).toEqual({ kind: "warning", secondsLeft: 60 });
  });

  it("expires on wake when the device slept through the warning", () => {
    const warned = advance(initialIdleState(t0), t0 + IDLE_MS);
    const woke = advance(warned, t0 + IDLE_MS + minutes(10));
    expect(statusOf(woke, t0 + IDLE_MS + minutes(10))).toEqual({ kind: "expired" });
  });

  it("'Stay signed in' resets everything", () => {
    const warned = advance(initialIdleState(t0), t0 + IDLE_MS);
    const stayed = resetIdle(t0 + IDLE_MS + 30_000);
    expect(statusOf(stayed, t0 + IDLE_MS + 30_000)).toEqual({ kind: "active" });
    expect(statusOf(advance(stayed, t0 + IDLE_MS + 30_000 + IDLE_MS - 1), t0 + IDLE_MS + 30_000 + IDLE_MS - 1)).toEqual({ kind: "active" });
    expect(warned).not.toEqual(stayed);
  });
});
