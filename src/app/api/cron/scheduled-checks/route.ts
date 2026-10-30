import { createAdminClient } from "@/lib/supabase/admin";
import { runCheck } from "@/server/cases/run-check";

// Vercel Cron calls this on weekdays during sandbox hours (vercel.json).
export const maxDuration = 300;

/** Cases checked more recently than this are skipped. */
const SKIP_IF_CHECKED_WITHIN_MS = 6 * 3_600_000;
/** Spacing between USCIS calls: the sandbox allows 5 per second. */
const SPACING_MS = 250;

export async function GET(request: Request) {
  // Read the header first: it also keeps this handler out of build-time prerendering.
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) {
    return new Response(null, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - SKIP_IF_CHECKED_WITHIN_MS).toISOString();
  // Only cases somebody tracks; pre-checked sandbox cases nobody follows are left alone.
  const { data: cases } = await admin
    .from("cases")
    .select("id, receipt_number, last_checked_at, tracked_cases!inner(id)")
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`);

  const summary = { checked: 0, changed: 0, failed: 0, stoppedEarly: false };
  const seen = new Set<string>();
  for (const row of cases ?? []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const result = await runCheck({ caseId: row.id, receiptNumber: row.receipt_number, trigger: "scheduled", requestedBy: null });
    summary.checked += 1;
    if (result.ok && result.changed) summary.changed += 1;
    if (!result.ok) {
      summary.failed += 1;
      // No point continuing when USCIS is closed or the daily budget is spent.
      if (result.outsideHours || result.errorCode === "quota_exhausted") {
        summary.stoppedEarly = true;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, SPACING_MS));
  }

  return Response.json(summary);
}
