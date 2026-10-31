"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseNoteBody } from "@/lib/attorney/notes";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/server/auth";

// Attorney-only tools on a shared case. RLS decides whether the share is active (ADR 0004);
// these actions only validate input and report errors as i18n keys under `attorneyNotes.errors`.

/** Ids arrive from the browser: validate them before they reach a query. */
const idSchema = z.uuid();

export type NoteState = { error?: string; ok?: boolean };

/** Adds a private note to a case shared with the signed-in attorney. */
export async function addAttorneyNote(trackedCaseId: string, _prev: NoteState, formData: FormData): Promise<NoteState> {
  idSchema.parse(trackedCaseId);
  const profile = await requireProfile("attorney");
  const body = parseNoteBody(formData.get("body"));
  if (!body.ok) return { error: body.error };
  const supabase = await createClient();
  const { error } = await supabase.from("attorney_notes").insert({ tracked_case_id: trackedCaseId, author_id: profile.id, body: body.body });
  if (error) return { error: error.code === "42501" ? "shareEnded" : "somethingWentWrong" };
  refresh();
  return { ok: true };
}

/** Replaces the text of one of the signed-in attorney's notes. */
export async function updateAttorneyNote(noteId: string, _prev: NoteState, formData: FormData): Promise<NoteState> {
  idSchema.parse(noteId);
  await requireProfile("attorney");
  const body = parseNoteBody(formData.get("body"));
  if (!body.ok) return { error: body.error };
  const supabase = await createClient();
  // RLS matches only the author's notes on cases still shared with them.
  const { data, error } = await supabase.from("attorney_notes").update({ body: body.body }).eq("id", noteId).select("id");
  if (error) return { error: "somethingWentWrong" };
  if (!data?.length) return { error: "shareEnded" };
  refresh();
  return { ok: true };
}

export async function deleteAttorneyNote(noteId: string): Promise<void> {
  idSchema.parse(noteId);
  await requireProfile("attorney");
  const supabase = await createClient();
  // RLS lets only the author delete it.
  await supabase.from("attorney_notes").delete().eq("id", noteId);
  refresh();
}

/** Clears "needs review" on a shared case until its next status event. Opening a case never does this. */
export async function markCaseReviewed(trackedCaseId: string): Promise<{ ok: boolean }> {
  idSchema.parse(trackedCaseId);
  await requireProfile("attorney");
  const supabase = await createClient();
  // RLS rejects it when the case is no longer shared; the optimistic UI then falls back to the server state.
  const { error } = await supabase.rpc("mark_case_reviewed", { target_tracked_case_id: trackedCaseId });
  refresh();
  return { ok: !error };
}
