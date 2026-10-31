import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, parseNoteBody } from "./notes";

describe("parseNoteBody", () => {
  it("keeps the note without surrounding whitespace", () => {
    expect(parseNoteBody("  Ask for the marriage certificate\n")).toEqual({ ok: true, body: "Ask for the marriage certificate" });
  });

  it("keeps line breaks inside the note", () => {
    expect(parseNoteBody("Call Monday.\nBring the I-864.")).toEqual({ ok: true, body: "Call Monday.\nBring the I-864." });
  });

  it("rejects an empty or blank note", () => {
    expect(parseNoteBody("")).toEqual({ ok: false, error: "noteRequired" });
    expect(parseNoteBody("   \n ")).toEqual({ ok: false, error: "noteRequired" });
    expect(parseNoteBody(null)).toEqual({ ok: false, error: "noteRequired" });
  });

  it("accepts up to 2000 characters and rejects more", () => {
    expect(NOTE_MAX_LENGTH).toBe(2000);
    expect(parseNoteBody("a".repeat(2000))).toEqual({ ok: true, body: "a".repeat(2000) });
    expect(parseNoteBody("a".repeat(2001))).toEqual({ ok: false, error: "noteTooLong" });
  });
});
