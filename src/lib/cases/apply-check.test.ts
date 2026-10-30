import { describe, expect, it } from "vitest";
import type { CaseSnapshot } from "@/lib/uscis/parse-response";
import { applyCheck, type StoredEvent } from "./apply-check";

const now = new Date("2026-10-30T15:00:00Z"); // 11:00 in New York

function snapshot(statusEn: string, history: CaseSnapshot["history"] = []): CaseSnapshot {
  return {
    receiptNumber: "EAC9999103403",
    formType: "I-130",
    submittedAt: null,
    uscisModifiedAt: null,
    status: { en: statusEn, es: null },
    description: { en: `Description of ${statusEn}`, es: null },
    history,
  };
}

describe("applyCheck", () => {
  it("records the current status on the first check without calling it a change", () => {
    const result = applyCheck([], snapshot("Case Was Received"), now);

    expect(result.changed).toBe(false);
    expect(result.newEvents).toEqual([
      {
        origin: "observed",
        occurredOn: "2026-10-30",
        observedAt: "2026-10-30T15:00:00.000Z",
        textEn: "Case Was Received",
        textEs: null,
        descriptionEn: "Description of Case Was Received",
        descriptionEs: null,
        category: "received",
      },
    ]);
  });

  it("adds nothing when the status is the same, even if USCIS formats it differently", () => {
    const previous: StoredEvent[] = [{ origin: "observed", occurredOn: "2026-10-01", textEn: "Case Was Received" }];

    const result = applyCheck(previous, snapshot("  case was   RECEIVED "), now);

    expect(result).toEqual({ changed: false, newEvents: [] });
  });

  it("records a new observed event when the status changes", () => {
    const previous: StoredEvent[] = [{ origin: "observed", occurredOn: "2026-10-01", textEn: "Case Was Received" }];

    const result = applyCheck(previous, snapshot("Request for Evidence Was Sent"), now);

    expect(result.changed).toBe(true);
    expect(result.newEvents).toMatchObject([
      { origin: "observed", textEn: "Request for Evidence Was Sent", category: "evidence_requested", occurredOn: "2026-10-30" },
    ]);
  });

  it("compares against the last observed status, not USCIS's own history", () => {
    const previous: StoredEvent[] = [
      { origin: "observed", occurredOn: "2026-10-01", textEn: "Case Was Received" },
      { origin: "reported", occurredOn: "2026-10-02", textEn: "We approved your Form I-130." },
    ];

    expect(applyCheck(previous, snapshot("Case Was Received"), now).changed).toBe(false);
  });

  it("adds every reported history entry on the first check, oldest first", () => {
    const history = [
      { date: "2023-09-05", en: "We approved your Form I-130.", es: "Aprobamos su Formulario I-130." },
      { date: "2023-01-12", en: "We received your Form I-130.", es: null },
    ];

    const result = applyCheck([], snapshot("Case Was Approved", history), now);

    expect(result.newEvents.map((event) => [event.origin, event.occurredOn, event.textEn])).toEqual([
      ["reported", "2023-01-12", "We received your Form I-130."],
      ["reported", "2023-09-05", "We approved your Form I-130."],
      ["observed", "2026-10-30", "Case Was Approved"],
    ]);
    expect(result.newEvents[1]).toMatchObject({ observedAt: null, textEs: "Aprobamos su Formulario I-130.", category: "approved" });
  });

  it("adds only the reported entries it has not saved yet", () => {
    const previous: StoredEvent[] = [
      { origin: "reported", occurredOn: "2023-01-12", textEn: "We received your Form I-130." },
      { origin: "observed", occurredOn: "2026-10-01", textEn: "Case Was Received" },
    ];
    const history = [
      { date: "2023-01-12", en: "We received your Form  I-130.", es: null },
      { date: "2026-10-29", en: "We sent you a request for additional evidence.", es: null },
    ];

    const result = applyCheck(previous, snapshot("Case Was Received", history), now);

    expect(result.changed).toBe(false);
    expect(result.newEvents.map((event) => event.textEn)).toEqual(["We sent you a request for additional evidence."]);
  });

  it("does not repeat a history entry USCIS lists twice", () => {
    const entry = { date: "2023-01-12", en: "We received your Form I-130.", es: null };

    const result = applyCheck([], snapshot("Case Was Received", [entry, entry]), now);

    expect(result.newEvents.filter((event) => event.origin === "reported")).toHaveLength(1);
  });

  it("uses the New York calendar date for observed events", () => {
    const lateNight = new Date("2026-10-31T02:30:00Z"); // still Oct 30 in New York

    expect(applyCheck([], snapshot("Case Was Received"), lateNight).newEvents[0]?.occurredOn).toBe("2026-10-30");
  });
});
