import { useLocale, useTranslations } from "next-intl";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusIndicator } from "@/components/status/status-indicator";
import { Timeline, type TimelineEvent } from "@/components/status/timeline";

/**
 * A live rendering of the case detail with sample data, instead of a screenshot.
 * Status texts are USCIS wording for the sandbox receipt EAC9999103403.
 */
const sample = {
  receipt: "EAC9999103403",
  form: "I-130",
  events: {
    en: [
      { id: "1", occurredOn: "2023-09-05", title: "Case Was Approved", origin: "reported", category: "approved" },
      { id: "2", occurredOn: "2023-08-14", title: "Case Is Being Actively Reviewed By USCIS", origin: "reported", category: "other" },
      { id: "3", occurredOn: "2023-03-22", title: "Biometrics Appointment Was Scheduled", origin: "reported", category: "biometrics" },
      { id: "4", occurredOn: "2023-01-12", title: "Case Was Received", origin: "reported", category: "received" },
    ],
    es: [
      { id: "1", occurredOn: "2023-09-05", title: "El caso fue aprobado", origin: "reported", category: "approved" },
      { id: "2", occurredOn: "2023-08-14", title: "USCIS está revisando activamente el caso", origin: "reported", category: "other" },
      { id: "3", occurredOn: "2023-03-22", title: "Se programó la cita de datos biométricos", origin: "reported", category: "biometrics" },
      { id: "4", occurredOn: "2023-01-12", title: "El caso fue recibido", origin: "reported", category: "received" },
    ],
  } satisfies Record<"en" | "es", TimelineEvent[]>,
};

export function LandingPreview() {
  const t = useTranslations("landing.preview");
  const locale = useLocale() === "es" ? "es" : "en";
  const events = sample.events[locale];

  return (
    <div aria-label={t("ariaLabel")} role="img" className="relative">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-raised sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
          <div className="min-w-0">
            <p className="text-heading text-ink">{t("nickname")}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              <ReceiptNumber value={sample.receipt} size="sm" />
              <span aria-hidden="true">·</span>
              <span>{t("form", { form: sample.form })}</span>
            </div>
          </div>
          <StatusIndicator label={events[0].title} category={events[0].category} />
        </div>
        <div className="pt-6">
          <p className="text-caps mb-4 text-ink-muted">{t("timeline")}</p>
          <Timeline events={events} />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-subtle">{t("caption")}</p>
    </div>
  );
}
