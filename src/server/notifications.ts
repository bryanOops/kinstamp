import "server-only";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { renderStatusChangeEmail } from "@/lib/emails/status-change";
import { siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { noticePlainText } from "@/lib/uscis/notice-text";

/**
 * Emails every client tracking the case (with notifications on) about its latest observed
 * status event. `notifications_sent` makes it idempotent: nobody gets the same event twice,
 * and a failed send releases its claim so the next status change or check retries it.
 */
export async function notifyStatusChange(caseId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("status_events")
    .select("id, text_en, text_es, description_en, description_es")
    .eq("case_id", caseId)
    .eq("origin", "observed")
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!event) return;

  const { data: trackers } = await admin
    .from("tracked_cases")
    .select("id, nickname, cases(receipt_number), profiles(id, email, locale, notify_on_change)")
    .eq("case_id", caseId);

  for (const tracker of trackers ?? []) {
    const person = tracker.profiles;
    if (!person?.notify_on_change) continue;

    // Claim the notification first; a duplicate insert means it was already sent.
    const { data: claim, error } = await admin
      .from("notifications_sent")
      .insert({ status_event_id: event.id, user_id: person.id })
      .select("id")
      .single();
    if (error || !claim) continue;

    const locale = isLocale(person.locale) ? person.locale : "en";
    const t = await getTranslations({ locale, namespace: "emails.statusChange" });
    const receiptNumber = tracker.cases?.receipt_number ?? "";
    const caseName = tracker.nickname || receiptNumber || t("fallbackCaseName");
    const status = (locale === "es" && event.text_es) || event.text_en;
    const description = noticePlainText((locale === "es" && event.description_es) || event.description_en || "");

    const { html, text } = renderStatusChangeEmail({
      lang: locale,
      caseName,
      receiptNumber,
      status,
      description,
      url: `${siteUrl()}/cases/${tracker.id}`,
      settingsUrl: `${siteUrl()}/settings`,
      copy: {
        heading: t("heading"),
        caseLabel: t("caseLabel"),
        receiptLabel: t("receiptLabel"),
        descriptionLabel: t("descriptionLabel"),
        cta: t("cta"),
        footer: t("footer"),
        manageNotifications: t("manageNotifications"),
        notAffiliated: t("notAffiliated"),
      },
    });

    const sent = await sendEmail({ to: person.email, subject: t("subject", { caseName }), html, text });
    if (!sent) await admin.from("notifications_sent").delete().eq("id", claim.id);
  }
}

/** Sends through Resend; returns false when it could not be sent (skipped or failed). */
async function sendEmail(message: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[notifications] email skipped (Resend not configured): "${message.subject}"`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...message }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) console.error(`[notifications] Resend returned HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("[notifications] Resend request failed", error);
    return false;
  }
}
