"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptNumber, type UscisErrorCode } from "@/lib/uscis";
import { requireProfile } from "@/server/auth";
import { FRESH_CHECK_MS, REFRESHES_PER_HOUR, refreshesInLastHour, runCheck } from "@/server/cases/run-check";

// Error values are i18n keys under `cases.errors`.

/** A case already checked within this window is linked without calling USCIS again. */
const RECENT_CHECK_MS = 60 * 60_000;

export type AddCaseState = {
  error?: string;
  fieldErrors?: { receiptNumber?: string; nickname?: string };
  values?: { receiptNumber?: string; nickname?: string };
};

const nicknameSchema = z
  .string()
  .trim()
  .max(80, "nicknameTooLong")
  .transform((value) => value || null);

export async function addCase(_prev: AddCaseState, formData: FormData): Promise<AddCaseState> {
  const profile = await requireProfile("client");
  const values = {
    receiptNumber: String(formData.get("receiptNumber") ?? ""),
    nickname: String(formData.get("nickname") ?? ""),
  };
  const receipt = parseReceiptNumber(values.receiptNumber);
  if (!receipt.ok) return { fieldErrors: { receiptNumber: "invalidReceipt" }, values };
  const nickname = nicknameSchema.safeParse(values.nickname);
  if (!nickname.success) return { fieldErrors: { nickname: "nicknameTooLong" }, values };

  const supabase = await createClient();
  const admin = createAdminClient();

  // Already tracking it: just open it.
  const { data: existingTracked } = await supabase
    .from("tracked_cases")
    .select("id, cases!inner(receipt_number)")
    .eq("client_id", profile.id)
    .eq("cases.receipt_number", receipt.value)
    .maybeSingle();
  if (existingTracked) redirect(`/cases/${existingTracked.id}`);

  // Cases are shared by receipt number (ADR 0001): reuse it if it exists.
  const { data: existingCase } = await admin
    .from("cases")
    .select("id, last_successful_check_at")
    .eq("receipt_number", receipt.value)
    .maybeSingle();

  let caseId = existingCase?.id;
  if (!caseId) {
    const { data: created, error } = await admin
      .from("cases")
      .insert({ receipt_number: receipt.value })
      .select("id")
      .single();
    if (error || !created) return { error: "somethingWentWrong", values };
    caseId = created.id;

    const check = await runCheck({ caseId, receiptNumber: receipt.value, trigger: "add", requestedBy: profile.id });
    if (!check.ok && (check.errorCode === "not_found" || check.errorCode === "invalid_receipt")) {
      // USCIS does not know this receipt: do not keep a case for it.
      await admin.from("cases").delete().eq("id", caseId);
      return { fieldErrors: { receiptNumber: check.errorCode === "not_found" ? "receiptNotFound" : "invalidReceipt" }, values };
    }
    // Any other failure (USCIS offline, quota): keep it as "awaiting first check".
  } else {
    const lastSuccess = existingCase?.last_successful_check_at;
    if (!lastSuccess || Date.now() - new Date(lastSuccess).getTime() > RECENT_CHECK_MS) {
      await runCheck({ caseId, receiptNumber: receipt.value, trigger: "add", requestedBy: profile.id });
    }
  }

  const { data: tracked, error: trackError } = await supabase
    .from("tracked_cases")
    .insert({ case_id: caseId, client_id: profile.id, nickname: nickname.data, last_viewed_at: new Date().toISOString() })
    .select("id")
    .single();
  if (trackError || !tracked) return { error: "somethingWentWrong", values };

  revalidatePath("/cases");
  redirect(`/cases/${tracked.id}`);
}

export type RefreshState =
  | { status: "idle" }
  | { status: "changed"; checkedAt: string }
  | { status: "unchanged"; checkedAt: string }
  | { status: "reused"; checkedAt: string }
  | { status: "error"; errorCode: UscisErrorCode | "rate_limited_person"; outsideHours: boolean; checkedAt?: string };

/** Refreshes a tracked case for its client or for an attorney it is shared with. */
export async function refreshCase(trackedCaseId: string, _prev: RefreshState): Promise<RefreshState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS returns the row only to the owner or an attorney with an active share.
  const { data: tracked } = await supabase
    .from("tracked_cases")
    .select("id, cases(id, receipt_number, last_successful_check_at)")
    .eq("id", trackedCaseId)
    .maybeSingle();
  const caseRow = tracked?.cases;
  if (!caseRow) return { status: "error", errorCode: "not_found", outsideHours: false };

  const lastSuccess = caseRow.last_successful_check_at;
  if (lastSuccess && Date.now() - new Date(lastSuccess).getTime() < FRESH_CHECK_MS) {
    return { status: "reused", checkedAt: lastSuccess };
  }
  if ((await refreshesInLastHour(profile.id)) >= REFRESHES_PER_HOUR) {
    return { status: "error", errorCode: "rate_limited_person", outsideHours: false };
  }

  const result = await runCheck({
    caseId: caseRow.id,
    receiptNumber: caseRow.receipt_number,
    trigger: "refresh",
    requestedBy: profile.id,
  });
  refresh();
  return result.ok
    ? { status: result.changed ? "changed" : "unchanged", checkedAt: result.checkedAt }
    : { status: "error", errorCode: result.errorCode, outsideHours: result.outsideHours, checkedAt: result.checkedAt };
}

/** Marks a tracked case as seen, for the "changed since your last visit" marker. */
export async function markCaseViewed(trackedCaseId: string): Promise<void> {
  const profile = await requireProfile("client");
  const supabase = await createClient();
  await supabase
    .from("tracked_cases")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", trackedCaseId)
    .eq("client_id", profile.id);
}

export type SimpleState = { error?: string; ok?: boolean };

export async function renameTrackedCase(trackedCaseId: string, _prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const profile = await requireProfile("client");
  const nickname = nicknameSchema.safeParse(String(formData.get("nickname") ?? ""));
  if (!nickname.success) return { error: "nicknameTooLong" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracked_cases")
    .update({ nickname: nickname.data })
    .eq("id", trackedCaseId)
    .eq("client_id", profile.id);
  if (error) return { error: "somethingWentWrong" };
  refresh();
  return { ok: true };
}

export async function untrackCase(trackedCaseId: string): Promise<void> {
  const profile = await requireProfile("client");
  const supabase = await createClient();
  await supabase.from("tracked_cases").delete().eq("id", trackedCaseId).eq("client_id", profile.id);
  revalidatePath("/cases");
  redirect("/cases");
}

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export async function shareCase(trackedCaseId: string, _prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const profile = await requireProfile("client");
  const email = emailSchema.safeParse(String(formData.get("attorneyEmail") ?? ""));
  if (!email.success) return { error: "invalidEmail" };
  if (email.data === profile.email) return { error: "cannotShareWithYourself" };

  // Shares go to attorneys only. An unknown email is fine: it stays pending until they sign up.
  const { data: existingAccount } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("email", email.data)
    .maybeSingle();
  if (existingAccount && existingAccount.role !== "attorney") return { error: "notAnAttorney" };

  const supabase = await createClient();
  const { error } = await supabase.from("shares").insert({ tracked_case_id: trackedCaseId, attorney_email: email.data });
  if (error) return { error: error.code === "23505" ? "alreadyShared" : "somethingWentWrong" };
  refresh();
  return { ok: true };
}

export async function revokeShare(shareId: string): Promise<void> {
  await requireProfile("client");
  const supabase = await createClient();
  // RLS lets only the owning client update the share.
  await supabase.from("shares").update({ revoked_at: new Date().toISOString() }).eq("id", shareId).is("revoked_at", null);
  refresh();
}

const keyDateSchema = z.object({
  kind: z.enum(["due_date", "appointment"], "keyDateKindRequired"),
  date: z.iso.date("keyDateDateRequired"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "keyDateTimeInvalid")
    .or(z.literal(""))
    .transform((value) => value || null),
  title: z.string().trim().min(1, "keyDateTitleRequired").max(120, "keyDateTitleTooLong"),
  notes: z
    .string()
    .trim()
    .max(1000, "keyDateNotesTooLong")
    .transform((value) => value || null),
});

export type KeyDateState = { error?: string; fieldErrors?: Partial<Record<keyof z.input<typeof keyDateSchema>, string>>; ok?: boolean };

/** Adds a key date copied from a USCIS notice. Clients and shared attorneys can add them. */
export async function addKeyDate(trackedCaseId: string, _prev: KeyDateState, formData: FormData): Promise<KeyDateState> {
  const profile = await requireProfile();
  const parsed = keyDateSchema.safeParse({
    kind: formData.get("kind"),
    date: formData.get("date"),
    time: String(formData.get("time") ?? ""),
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: KeyDateState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<KeyDateState["fieldErrors"]>;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("key_dates")
    .insert({ tracked_case_id: trackedCaseId, created_by: profile.id, ...parsed.data });
  if (error) return { error: "somethingWentWrong" };
  refresh();
  return { ok: true };
}

export async function deleteKeyDate(keyDateId: string): Promise<void> {
  await requireProfile();
  const supabase = await createClient();
  // RLS allows the creator or the owning client.
  await supabase.from("key_dates").delete().eq("id", keyDateId);
  refresh();
}

export async function setInsightsConsent(granted: boolean): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  if (granted) {
    const { error } = await supabase.from("consents").insert({ user_id: profile.id, kind: "insights" });
    // 23505: already granted; nothing to do.
    if (error && error.code !== "23505") throw error;
  } else {
    await supabase
      .from("consents")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .eq("kind", "insights")
      .is("revoked_at", null);
  }
  refresh();
}

export async function setNotifyOnChange(enabled: boolean): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("profiles").update({ notify_on_change: enabled }).eq("id", profile.id);
  refresh();
}

/**
 * Deletes the signed-in person's account and everything that cascades from it
 * (tracked cases, shares, key dates, consent). Cases nobody tracks anymore because of
 * this deletion are removed with their history (docs/spec.md, 4.7).
 */
export async function deleteAccount(): Promise<void> {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data: tracked } = await admin.from("tracked_cases").select("case_id").eq("client_id", profile.id);
  const caseIds = (tracked ?? []).map((row) => row.case_id);

  await admin.from("shares").delete().eq("attorney_email", profile.email);
  const { error } = await admin.auth.admin.deleteUser(profile.id);
  if (error) throw error;

  for (const caseId of caseIds) {
    const { count } = await admin.from("tracked_cases").select("id", { count: "exact", head: true }).eq("case_id", caseId);
    if ((count ?? 0) === 0) await admin.from("cases").delete().eq("id", caseId);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
