import { describe, expect, it } from "vitest";
import { groupNotesByRecency, matchesNoteQuery, NOTES_PREVIEW, splitNote } from "./notes-view";

const note = (id: string, updatedAt: string, body = id) => ({ id, body, createdAt: updatedAt, updatedAt });

describe("splitNote", () => {
  it("uses the first line as the title and the rest as a one-line preview", () => {
    expect(splitNote("Call Monday.\nBring the I-864.")).toEqual({ title: "Call Monday.", preview: "Bring the I-864." });
  });

  it("skips blank leading lines and collapses the remaining lines into one preview", () => {
    expect(splitNote("\n\n  Ask for the marriage certificate  \n\nAlso the lease.\n  And the photos.\n")).toEqual({
      title: "Ask for the marriage certificate",
      preview: "Also the lease. And the photos.",
    });
  });

  it("leaves the preview empty for a one-line note", () => {
    expect(splitNote("Ask for the marriage certificate")).toEqual({ title: "Ask for the marriage certificate", preview: "" });
  });

  it("returns an empty title for a blank note", () => {
    expect(splitNote("   \n ")).toEqual({ title: "", preview: "" });
  });
});

describe("groupNotesByRecency", () => {
  // Friday Oct 30, 2026 at 10:00 local time.
  const now = new Date(2026, 9, 30, 10, 0);
  const local = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h).toISOString();

  it("groups by the last edit into today, the previous 7 days and earlier, newest first", () => {
    const notes = [
      note("earlier", local(2026, 10, 1)),
      note("today-early", local(2026, 10, 30, 1)),
      note("week", local(2026, 10, 25)),
      note("today-late", local(2026, 10, 30, 9)),
      note("week-edge", local(2026, 10, 23, 8)),
      note("ancient", local(2025, 1, 15)),
    ];
    expect(groupNotesByRecency(notes, now).map((group) => [group.key, group.notes.map((n) => n.id)])).toEqual([
      ["today", ["today-late", "today-early"]],
      ["previous7Days", ["week", "week-edge"]],
      ["earlier", ["earlier", "ancient"]],
    ]);
  });

  it("omits empty groups", () => {
    expect(groupNotesByRecency([note("a", local(2026, 10, 30, 8))], now).map((group) => group.key)).toEqual(["today"]);
    expect(groupNotesByRecency([], now)).toEqual([]);
  });

  it("puts a note from just before midnight yesterday in the previous 7 days", () => {
    expect(groupNotesByRecency([note("late", local(2026, 10, 29, 23))], now).map((group) => group.key)).toEqual(["previous7Days"]);
  });

  it("puts a note edited 8 days ago in earlier", () => {
    expect(groupNotesByRecency([note("old", local(2026, 10, 22, 9))], now).map((group) => group.key)).toEqual(["earlier"]);
  });
});

describe("matchesNoteQuery", () => {
  it("matches every word, ignoring case and accents", () => {
    expect(matchesNoteQuery("Pedir el acta de matrimonio\nY la partida", "ACTA matrimonio")).toBe(true);
    expect(matchesNoteQuery("Pedir el acta de matrimonio", "partida")).toBe(false);
    expect(matchesNoteQuery("Reunión el lunes", "reunion")).toBe(true);
  });

  it("matches everything on a blank query", () => {
    expect(matchesNoteQuery("anything", "")).toBe(true);
    expect(matchesNoteQuery("anything", "   ")).toBe(true);
  });
});

describe("NOTES_PREVIEW", () => {
  it("shows three notes on the case page", () => {
    expect(NOTES_PREVIEW).toBe(3);
  });
});
