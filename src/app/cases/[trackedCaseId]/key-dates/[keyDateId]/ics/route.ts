import { buildIcsEvent } from "@/lib/ics";
import { getCurrentProfile } from "@/server/auth";
import { getKeyDate } from "@/server/cases/queries";

/**
 * Calendar file for one key date. The key date is read through the person's own
 * Supabase client, so RLS decides whether they may see it (tracker or shared attorney).
 */
export async function GET(_request: Request, context: RouteContext<"/cases/[trackedCaseId]/key-dates/[keyDateId]/ics">) {
  const { trackedCaseId, keyDateId } = await context.params;
  const profile = await getCurrentProfile();
  if (!profile) return new Response(null, { status: 401 });

  const keyDate = await getKeyDate(keyDateId);
  if (!keyDate || keyDate.trackedCaseId !== trackedCaseId) return new Response(null, { status: 404 });

  const ics = buildIcsEvent({
    uid: `${keyDate.id}@kinstamp`,
    title: keyDate.title,
    description: keyDate.notes,
    date: keyDate.date,
    // Postgres returns HH:MM:SS; the builder wants HH:MM.
    time: keyDate.time?.slice(0, 5) ?? null,
    timeZone: "America/New_York",
    stamp: new Date(),
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/cases/${trackedCaseId}`,
  });
  const filename = `${keyDate.title.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "key-date"}.ics`;

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Inline: iPhone and Mac open it straight into Calendar instead of saving a file.
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
