import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StatusCategory } from "@/lib/cases/categorize";

// Reads run as the signed-in person, so RLS decides what comes back (ADR 0004).

export type CaseStatusView = {
  receiptNumber: string;
  formType: string | null;
  statusEn: string | null;
  statusEs: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  category: StatusCategory | null;
  checkState: "awaiting_first_check" | "ok" | "error";
  lastCheckedAt: string | null;
  lastSuccessfulCheckAt: string | null;
  lastErrorCode: string | null;
  submittedAt: string | null;
};

export type TrackedCaseSummary = {
  trackedCaseId: string;
  nickname: string | null;
  case: CaseStatusView;
  lastChangeOn: string | null;
  /** A status event appeared after the client last opened this case. */
  changedSinceLastVisit: boolean;
};

export type StatusEventView = {
  id: string;
  origin: "reported" | "observed";
  occurredOn: string;
  observedAt: string | null;
  textEn: string;
  textEs: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  category: StatusCategory;
};

export type ShareView = {
  id: string;
  attorneyEmail: string;
  createdAt: string;
  revokedAt: string | null;
};

export type KeyDateView = {
  id: string;
  kind: "due_date" | "appointment";
  date: string;
  time: string | null;
  title: string;
  notes: string | null;
  createdBy: string;
};

export type TrackedCaseDetail = TrackedCaseSummary & {
  caseId: string;
  clientId: string;
  timeline: StatusEventView[];
  shares: ShareView[];
  keyDates: KeyDateView[];
};

const caseColumns =
  "id, receipt_number, form_type, status_en, status_es, description_en, description_es, status_category, check_state, last_checked_at, last_successful_check_at, last_error_code, submitted_at";

type CaseRow = {
  receipt_number: string;
  form_type: string | null;
  status_en: string | null;
  status_es: string | null;
  description_en: string | null;
  description_es: string | null;
  status_category: string | null;
  check_state: string;
  last_checked_at: string | null;
  last_successful_check_at: string | null;
  last_error_code: string | null;
  submitted_at: string | null;
};

function toCaseView(row: CaseRow): CaseStatusView {
  return {
    receiptNumber: row.receipt_number,
    formType: row.form_type,
    statusEn: row.status_en,
    statusEs: row.status_es,
    descriptionEn: row.description_en,
    descriptionEs: row.description_es,
    category: row.status_category as StatusCategory | null,
    checkState: row.check_state as CaseStatusView["checkState"],
    lastCheckedAt: row.last_checked_at,
    lastSuccessfulCheckAt: row.last_successful_check_at,
    lastErrorCode: row.last_error_code,
    submittedAt: row.submitted_at,
  };
}

/** The signed-in client's tracked cases, most recently changed first. */
export async function listTrackedCases(clientId: string): Promise<TrackedCaseSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tracked_cases")
    .select(`id, nickname, last_viewed_at, created_at, cases (${caseColumns}, status_events (occurred_on, created_at))`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((row) => row.cases)
    .map((row) => {
      const caseRow = row.cases!;
      const events = caseRow.status_events ?? [];
      const lastChangeOn = events.map((e) => e.occurred_on).sort().at(-1) ?? null;
      const lastEventCreated = events.map((e) => e.created_at).sort().at(-1) ?? null;
      return {
        trackedCaseId: row.id,
        nickname: row.nickname,
        case: toCaseView(caseRow),
        lastChangeOn,
        changedSinceLastVisit: Boolean(
          row.last_viewed_at && lastEventCreated && lastEventCreated > row.last_viewed_at,
        ),
      };
    })
    .sort((a, b) => (b.lastChangeOn ?? "").localeCompare(a.lastChangeOn ?? ""));
}

/** One tracked case with its timeline, shares and key dates; null when RLS hides it. */
export async function getTrackedCaseDetail(trackedCaseId: string): Promise<TrackedCaseDetail | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tracked_cases")
    .select(
      `id, client_id, nickname, last_viewed_at, cases (${caseColumns}, status_events (id, origin, occurred_on, observed_at, text_en, text_es, description_en, description_es, category, created_at)), shares (id, attorney_email, created_at, revoked_at), key_dates (id, kind, date, time, title, notes, created_by)`,
    )
    .eq("id", trackedCaseId)
    .maybeSingle();
  if (!row?.cases) return null;

  const caseRow = row.cases;
  const timeline: StatusEventView[] = [...(caseRow.status_events ?? [])]
    .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on) || a.created_at.localeCompare(b.created_at))
    .map((e) => ({
      id: e.id,
      origin: e.origin === "reported" ? "reported" : "observed",
      occurredOn: e.occurred_on,
      observedAt: e.observed_at,
      textEn: e.text_en,
      textEs: e.text_es,
      descriptionEn: e.description_en,
      descriptionEs: e.description_es,
      category: e.category as StatusCategory,
    }));
  const lastEventCreated = (caseRow.status_events ?? []).map((e) => e.created_at).sort().at(-1) ?? null;

  return {
    trackedCaseId: row.id,
    caseId: caseRow.id,
    clientId: row.client_id,
    nickname: row.nickname,
    case: toCaseView(caseRow),
    lastChangeOn: timeline.at(-1)?.occurredOn ?? null,
    changedSinceLastVisit: Boolean(row.last_viewed_at && lastEventCreated && lastEventCreated > row.last_viewed_at),
    timeline,
    shares: (row.shares ?? [])
      .map((s) => ({ id: s.id, attorneyEmail: s.attorney_email, createdAt: s.created_at, revokedAt: s.revoked_at }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    keyDates: (row.key_dates ?? [])
      .map((k) => ({
        id: k.id,
        kind: k.kind === "appointment" ? ("appointment" as const) : ("due_date" as const),
        date: k.date,
        time: k.time,
        title: k.title,
        notes: k.notes,
        createdBy: k.created_by,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export type SharedCaseRow = {
  shareId: string;
  trackedCaseId: string;
  clientName: string;
  nickname: string | null;
  receiptNumber: string;
  formType: string | null;
  statusEn: string | null;
  statusEs: string | null;
  category: StatusCategory | null;
  checkState: CaseStatusView["checkState"];
  lastSuccessfulCheckAt: string | null;
  lastChangeOn: string | null;
  nextKeyDate: string | null;
  sharedAt: string;
};

/** Cases shared with the signed-in attorney, most urgent key date first. */
export async function listSharedCases(): Promise<SharedCaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("attorney_shared_cases");
  return (data ?? [])
    .map((r) => ({
      shareId: r.share_id,
      trackedCaseId: r.tracked_case_id,
      clientName: r.client_name,
      nickname: r.nickname,
      receiptNumber: r.receipt_number,
      formType: r.form_type,
      statusEn: r.status_en,
      statusEs: r.status_es,
      category: r.status_category as StatusCategory | null,
      checkState: r.check_state as CaseStatusView["checkState"],
      lastSuccessfulCheckAt: r.last_successful_check_at,
      lastChangeOn: r.last_change_on,
      nextKeyDate: r.next_key_date,
      sharedAt: r.shared_at,
    }))
    .sort((a, b) => (a.nextKeyDate ?? "9999").localeCompare(b.nextKeyDate ?? "9999"));
}

/** Whether the person currently consents to anonymous use of their data in insights. */
export async function hasInsightsConsent(personId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("consents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", personId)
    .eq("kind", "insights")
    .is("revoked_at", null);
  return (count ?? 0) > 0;
}
