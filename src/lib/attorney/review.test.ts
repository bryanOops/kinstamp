import { describe, expect, it } from "vitest";
import { needsReview } from "./review";

const sharedAt = "2026-10-01T15:00:00+00:00";

describe("needsReview", () => {
  it("is false for a case without status events", () => {
    expect(needsReview({ lastEventAt: null, reviewedAt: null, sharedAt })).toBe(false);
  });

  describe("when the attorney never reviewed the case", () => {
    it("is true when a status event was recorded after the case was shared", () => {
      expect(needsReview({ lastEventAt: "2026-10-05T14:00:00+00:00", reviewedAt: null, sharedAt })).toBe(true);
    });

    it("is false when the newest status event was already there when the case was shared", () => {
      expect(needsReview({ lastEventAt: "2026-09-20T14:00:00+00:00", reviewedAt: null, sharedAt })).toBe(false);
    });
  });

  describe("when the attorney reviewed the case", () => {
    const reviewedAt = "2026-10-10T18:30:00+00:00";

    it("is false when nothing was recorded after the review, even if it changed after the share", () => {
      expect(needsReview({ lastEventAt: "2026-10-05T14:00:00+00:00", reviewedAt, sharedAt })).toBe(false);
    });

    it("is true when a status event was recorded after the review", () => {
      expect(needsReview({ lastEventAt: "2026-10-12T14:00:00+00:00", reviewedAt, sharedAt })).toBe(true);
    });

    it("is false when the event was recorded at the exact moment of the review", () => {
      expect(needsReview({ lastEventAt: reviewedAt, reviewedAt, sharedAt })).toBe(false);
    });
  });

  it("compares instants, not strings, so offsets and precision do not matter", () => {
    // 18:30:00.5 UTC written two ways: Postgres sends `+00:00`, JavaScript writes `Z`.
    expect(needsReview({ lastEventAt: "2026-10-10T13:30:00.5-05:00", reviewedAt: "2026-10-10T18:30:00Z", sharedAt })).toBe(true);
    expect(needsReview({ lastEventAt: "2026-10-10T18:30:00Z", reviewedAt: "2026-10-10T18:30:00.123456+00:00", sharedAt })).toBe(false);
  });
});
