import { describe, expect, it } from "vitest";
import { placeCard, resolveSteps, type Box } from "./steps";

describe("resolveSteps", () => {
  const steps = [{ id: "welcome" }, { id: "addCase", target: "add-case" }, { id: "caseCard", target: "case-card" }, { id: "account", target: "account-menu" }];

  it("keeps unanchored steps and the anchored ones whose target is on the page", () => {
    const present = new Set(["add-case", "account-menu"]);
    expect(resolveSteps(steps, (target) => present.has(target)).map((s) => s.id)).toEqual(["welcome", "addCase", "account"]);
  });

  it("returns every step when every target is present", () => {
    expect(resolveSteps(steps, () => true)).toHaveLength(4);
  });
});

describe("placeCard", () => {
  const viewport = { width: 1440, height: 900 };
  const card = { width: 360, height: 200 };

  it("sits below the target, aligned to its left edge, when there is room", () => {
    const target: Box = { top: 100, left: 300, width: 200, height: 44 };
    expect(placeCard(target, card, viewport)).toEqual({ top: 100 + 44 + 12, left: 300 });
  });

  it("moves above the target when there is no room below", () => {
    const target: Box = { top: 800, left: 300, width: 200, height: 44 };
    expect(placeCard(target, card, viewport)).toEqual({ top: 800 - 12 - 200, left: 300 });
  });

  it("stays inside the viewport horizontally", () => {
    const target: Box = { top: 100, left: 1300, width: 120, height: 44 };
    expect(placeCard(target, card, viewport)).toEqual({ top: 156, left: 1440 - 16 - 360 });
  });

  it("goes beside a tall target that leaves no room above or below", () => {
    const target: Box = { top: 40, left: 100, width: 400, height: 820 };
    expect(placeCard(target, card, viewport)).toEqual({ top: 40, left: 100 + 400 + 12 });
  });

  it("centers in the viewport when there is no target", () => {
    expect(placeCard(null, card, viewport)).toEqual({ top: (900 - 200) / 2, left: (1440 - 360) / 2 });
  });
});
