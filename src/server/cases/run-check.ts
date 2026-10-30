import "server-only";
import { applyCheck, type StoredEvent } from "@/lib/cases/apply-check";
import { categorizeStatus } from "@/lib/cases/categorize";
import { easternDayStart } from "@/lib/time";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUscisClient, type UscisErrorCode } from "@/lib/uscis";
import { notifyStatusChange } from "@/server/notifications";

/** Stop calling USCIS a little before the sandbox's 1,000 daily checks run out. */
export const DAILY_CHECK_BUDGET = 900;
/** A successful check younger than this is reused instead of calling USCIS again. */
export const FRESH_CHECK_MS = 60_000;
/** Checks one person can trigger per hour (adding cases and refreshing). */
export const CHECKS_PER_PERSON_PER_HOUR = 30;

export type CheckTrigger = "add" | "refresh" | "scheduled";

export type CheckResult =
  | { ok: true; changed: boolean; checkedAt: string }
  | { ok: false; errorCode: UscisErrorCode; outsideHours: boolean; checkedAt: string };

/**
 * Runs one check of a case against USCIS and records it: appends status events
 * (ADR 0002), updates the case's current status and logs the check.
 * Callers must have verified access to the case first; this writes with the service role.
 */
export async function runCheck(params: {
  caseId: string;
  receiptNumber: string;
  trigger: CheckTrigger;
  requestedBy: string | null;
}): Promise<CheckResult> {
  const admin = createAdminClient();
  const startedAt = Date.now();

  if (await dailyBudgetSpent()) {
    return { ok: false, errorCode: "quota_exhausted", outsideHours: false, checkedAt: new Date().toISOString() };
  }

  const result = await getUscisClient().getCase(params.receiptNumber);
  const now = new Date();
  const durationMs = Date.now() - startedAt;

  if (!result.ok) {
    const { data: current } = await admin.from("cases").select("check_state").eq("id", params.caseId).single();
    await admin
      .from("cases")
      .update({
        last_checked_at: now.toISOString(),
        last_error_code: result.error.code,
        // A case that never had a successful check stays "awaiting" while USCIS is unreachable.
        check_state:
          current?.check_state === "ok" ? "ok" : isTransient(result.error.code) ? "awaiting_first_check" : "error",
      })
      .eq("id", params.caseId);
    await admin.from("case_checks").insert({
      case_id: params.caseId,
      trigger: params.trigger,
      requested_by: params.requestedBy,
      result: "error",
      error_code: result.error.code,
      http_status: result.httpStatus,
      duration_ms: durationMs,
    });
    return { ok: false, errorCode: result.error.code, outsideHours: result.error.outsideHours, checkedAt: now.toISOString() };
  }

  const { data: saved } = await admin
    .from("status_events")
    .select("origin, occurred_on, text_en")
    .eq("case_id", params.caseId)
    .order("occurred_on")
    .order("created_at");
  const previous: StoredEvent[] = (saved ?? []).map((event) => ({
    origin: event.origin === "reported" ? "reported" : "observed",
    occurredOn: event.occurred_on,
    textEn: event.text_en,
  }));

  const { snapshot } = result;
  const outcome = applyCheck(previous, snapshot, now);

  if (outcome.newEvents.length > 0) {
    await admin.from("status_events").upsert(
      outcome.newEvents.map((event) => ({
        case_id: params.caseId,
        origin: event.origin,
        occurred_on: event.occurredOn,
        observed_at: event.observedAt,
        text_en: event.textEn,
        text_es: event.textEs,
        description_en: event.descriptionEn,
        description_es: event.descriptionEs,
        category: event.category,
      })),
      { onConflict: "case_id,origin,occurred_on,text_en", ignoreDuplicates: true },
    );
  }

  await admin
    .from("cases")
    .update({
      form_type: snapshot.formType,
      submitted_at: snapshot.submittedAt,
      uscis_modified_at: snapshot.uscisModifiedAt,
      status_en: snapshot.status.en,
      status_es: snapshot.status.es,
      description_en: snapshot.description.en,
      description_es: snapshot.description.es,
      status_category: categorizeStatus(snapshot.status.en),
      check_state: "ok",
      last_checked_at: now.toISOString(),
      last_successful_check_at: now.toISOString(),
      last_error_code: null,
    })
    .eq("id", params.caseId);

  await admin.from("case_checks").insert({
    case_id: params.caseId,
    trigger: params.trigger,
    requested_by: params.requestedBy,
    result: outcome.changed ? "changed" : "unchanged",
    http_status: result.httpStatus,
    duration_ms: durationMs,
  });

  if (outcome.changed) await notifyStatusChange(params.caseId);

  return { ok: true, changed: outcome.changed, checkedAt: now.toISOString() };
}

/** Errors after which the receipt may still be valid: retry later instead of marking the case as failed. */
function isTransient(code: UscisErrorCode): boolean {
  return ["unavailable", "timeout", "rate_limited", "quota_exhausted"].includes(code);
}

async function dailyBudgetSpent(): Promise<boolean> {
  const { count } = await createAdminClient()
    .from("case_checks")
    .select("id", { count: "exact", head: true })
    .gte("created_at", easternDayStart(new Date()).toISOString())
    .not("http_status", "is", null);
  return (count ?? 0) >= DAILY_CHECK_BUDGET;
}

/** Checks this person triggered in the last hour (adds and refreshes), for the per-person limit. */
export async function checksRequestedInLastHour(personId: string): Promise<number> {
  const { count } = await createAdminClient()
    .from("case_checks")
    .select("id", { count: "exact", head: true })
    .eq("requested_by", personId)
    .in("trigger", ["add", "refresh"])
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  return count ?? 0;
}
