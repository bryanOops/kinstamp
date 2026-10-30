import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const copy = {
  en: {
    subject: (name: string) => `Update on ${name}`,
    heading: "Your case has a new status",
    cta: "Open in Kinstamp",
    footer: "You get this email because you track this case in Kinstamp. You can turn these emails off in Settings.",
  },
  es: {
    subject: (name: string) => `Novedad en ${name}`,
    heading: "Tu caso tiene un estado nuevo",
    cta: "Abrir en Kinstamp",
    footer: "Recibes este correo porque sigues este caso en Kinstamp. Puedes desactivarlos en Configuración.",
  },
} as const;

/**
 * Emails every client tracking the case (with notifications on) about its latest observed
 * status event. `notifications_sent` makes it idempotent: nobody gets the same event twice.
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
    const { error } = await admin.from("notifications_sent").insert({ status_event_id: event.id, user_id: person.id });
    if (error) continue;

    const locale = person.locale === "es" ? "es" : "en";
    const t = copy[locale];
    const caseName = tracker.nickname ?? tracker.cases?.receipt_number ?? "your case";
    const status = (locale === "es" && event.text_es) || event.text_en;
    const description = (locale === "es" && event.description_es) || event.description_en || "";
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/cases/${tracker.id}`;

    await sendEmail({
      to: person.email,
      subject: t.subject(caseName),
      html: `<div style="font-family:Inter,Arial,sans-serif;color:#0b0b0f;max-width:520px">
        <p style="color:#5c5c66;margin:0 0 8px">${escapeHtml(caseName)}</p>
        <h1 style="font-size:20px;margin:0 0 12px">${t.heading}: ${escapeHtml(status)}</h1>
        <p style="line-height:1.5;color:#3a3a42">${escapeHtml(description)}</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#0b0b0f;color:#fff;border-radius:8px;text-decoration:none">${t.cta}</a></p>
        <p style="font-size:12px;color:#5c5c66">${t.footer}</p>
      </div>`,
    });
  }
}

async function sendEmail(message: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[notifications] email skipped (Resend not configured): "${message.subject}"`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, ...message }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) console.error(`[notifications] Resend returned HTTP ${response.status}`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
