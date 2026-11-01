import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth";

/**
 * "Download my data": everything Kinstamp stores about the signed-in person, as JSON.
 * Every query runs with the person's session, so RLS decides what is theirs.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new Response(null, { status: 401 });

  const supabase = await createClient();
  const [profileRow, consents, tracked, shares, keyDates, assistantUsage, notes, reviews, notifications] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role, locale, notify_on_change, tours_completed, created_at")
      .eq("id", profile.id)
      .single(),
    supabase.from("consents").select("kind, granted_at, revoked_at").eq("user_id", profile.id).order("granted_at"),
    supabase
      .from("tracked_cases")
      .select("nickname, created_at, last_viewed_at, cases(receipt_number, form_type, status_en, submitted_at, last_successful_check_at)")
      .eq("client_id", profile.id)
      .order("created_at"),
    supabase.from("shares").select("attorney_email, created_at, revoked_at, tracked_cases(nickname, cases(receipt_number))").order("created_at"),
    supabase.from("key_dates").select("kind, date, time, title, notes, created_at, tracked_cases(nickname, cases(receipt_number))").eq("created_by", profile.id).order("date"),
    supabase.from("assistant_usage").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    // Attorneys: private notes and reviews on cases still shared with them (RLS hides the rest).
    supabase.from("attorney_notes").select("body, created_at, updated_at, tracked_cases(nickname, cases(receipt_number))").eq("author_id", profile.id).order("created_at"),
    supabase.from("attorney_reviews").select("reviewed_at, tracked_cases(nickname, cases(receipt_number))").eq("attorney_id", profile.id),
    supabase.from("notifications_sent").select("sent_at").eq("user_id", profile.id).order("sent_at"),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    note: "Everything Kinstamp stores about you. USCIS case statuses are public and shared by receipt number; conversations with the case assistant are never stored.",
    profile: profileRow.data,
    consents: consents.data ?? [],
    trackedCases: tracked.data ?? [],
    shares: shares.data ?? [],
    keyDatesYouAdded: keyDates.data ?? [],
    assistantQuestionsAsked: assistantUsage.count ?? 0,
    statusChangeEmailsSent: notifications.data?.length ?? 0,
    ...(profile.role === "attorney" ? { attorneyNotes: notes.data ?? [], casesYouReviewed: reviews.data ?? [] } : {}),
  };

  const date = data.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kinstamp-my-data-${date}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
