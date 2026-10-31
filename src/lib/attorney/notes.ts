import { z } from "zod";

/** Same limit as the `attorney_notes.body` check in the database. */
export const NOTE_MAX_LENGTH = 2000;

// Error values are i18n keys under `attorneyNotes.errors`.
const noteBodySchema = z.string("noteRequired").trim().min(1, "noteRequired").max(NOTE_MAX_LENGTH, "noteTooLong");

export type NoteBodyResult = { ok: true; body: string } | { ok: false; error: "noteRequired" | "noteTooLong" };

/** Validates the text of a private attorney note as it arrives from a form. */
export function parseNoteBody(input: unknown): NoteBodyResult {
  const parsed = noteBodySchema.safeParse(input);
  if (parsed.success) return { ok: true, body: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message === "noteTooLong" ? "noteTooLong" : "noteRequired" };
}
