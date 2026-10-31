// Pure helpers behind the attorney notes views: the preview card on the case page and the
// "all notes" dialog. No React, no dates other than the `now` handed in.

/** How many notes the case page shows before "See all notes". */
export const NOTES_PREVIEW = 3;

export type NoteLike = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type RecencyGroupKey = "today" | "previous7Days" | "earlier";

export type RecencyGroup<T extends NoteLike> = { key: RecencyGroupKey; notes: T[] };

/** First non-blank line as the title; the remaining non-blank lines collapsed into one preview line. */
export function splitNote(body: string): { title: string; preview: string } {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [title = "", ...rest] = lines;
  return { title, preview: rest.join(" ").replace(/\s+/g, " ") };
}

const DAY_MS = 86_400_000;

/** Local midnight of the day containing `at`, so "today" follows the attorney's calendar, not the server's. */
function startOfLocalDay(at: Date): number {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
}

function recencyOf(updatedAt: string, now: Date): RecencyGroupKey {
  const today = startOfLocalDay(now);
  const day = startOfLocalDay(new Date(updatedAt));
  if (day >= today) return "today";
  if (day >= today - 7 * DAY_MS) return "previous7Days";
  return "earlier";
}

/**
 * Notes grouped by when they were last edited, like iOS Notes: Today, Previous 7 days, Earlier.
 * Newest first inside each group; empty groups are left out.
 */
export function groupNotesByRecency<T extends NoteLike>(notes: readonly T[], now: Date): RecencyGroup<T>[] {
  const order: RecencyGroupKey[] = ["today", "previous7Days", "earlier"];
  const sorted = [...notes].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return order
    .map((key) => ({ key, notes: sorted.filter((note) => recencyOf(note.updatedAt, now) === key) }))
    .filter((group) => group.notes.length > 0);
}

/** Lowercase, accent-free (NFD + strip combining marks), trimmed. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Case- and accent-insensitive; every word of the query must appear somewhere in the note. A blank query matches. */
export function matchesNoteQuery(body: string, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(body);
  return words.every((word) => haystack.includes(word));
}
