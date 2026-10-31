import "server-only";
import { createClient } from "@/lib/supabase/server";

// Reads for the attorney's own tools on a shared case. They run as the signed-in attorney, so RLS
// returns nothing once the share is revoked (ADR 0004).

export type SharedCaseClient = {
  clientName: string;
  clientEmail: string;
  /** When the active share to this attorney was created. */
  sharedAt: string;
};

/** The client behind a case shared with the signed-in attorney; null without an active share to them. */
export async function getSharedCaseClient(trackedCaseId: string): Promise<SharedCaseClient | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_case_client", { target_tracked_case_id: trackedCaseId });
  const row = data?.[0];
  return row ? { clientName: row.client_name, clientEmail: row.client_email, sharedAt: row.shared_at } : null;
}

export type AttorneyNoteView = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/** The signed-in attorney's private notes on a shared case, newest first. */
export async function listAttorneyNotes(trackedCaseId: string): Promise<AttorneyNoteView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attorney_notes")
    .select("id, body, created_at, updated_at")
    .eq("tracked_case_id", trackedCaseId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at }));
}

/** When the signed-in attorney last marked the case as reviewed, or null if never. */
export async function getReviewedAt(trackedCaseId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("attorney_reviews").select("reviewed_at").eq("tracked_case_id", trackedCaseId).maybeSingle();
  return data?.reviewed_at ?? null;
}
