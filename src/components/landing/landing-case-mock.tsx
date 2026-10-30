import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusDot, StatusIndicator } from "@/components/status/status-indicator";
import { Timeline, type TimelineEvent } from "@/components/status/timeline";

/**
 * A case detail rendered with the app's own primitives and sample data, instead of a
 * screenshot. Status titles are USCIS wording for the sandbox receipt EAC9999103403.
 * `now` is pinned so the key-date countdown is deterministic.
 */
const sample = {
  receipt: "EAC9999103403",
  form: "I-130",
  now: new Date("2023-08-18T12:00:00Z"),
  keyDate: "2023-08-23",
  lastChangeOn: "2023-08-14",
  shareEmail: "attorney@example.com",
  shareSince: "2023-02-01",
  events: {
    en: [
      { id: "1", occurredOn: "2023-08-14", title: "Interview Was Scheduled", origin: "reported", category: "interview" },
      { id: "2", occurredOn: "2023-03-22", title: "Biometrics Appointment Was Scheduled", origin: "reported", category: "biometrics" },
      { id: "3", occurredOn: "2023-01-12", title: "Case Was Received", origin: "reported", category: "received" },
    ],
    es: [
      { id: "1", occurredOn: "2023-08-14", title: "Se programó la entrevista", origin: "reported", category: "interview" },
      { id: "2", occurredOn: "2023-03-22", title: "Se programó la cita de datos biométricos", origin: "reported", category: "biometrics" },
      { id: "3", occurredOn: "2023-01-12", title: "El caso fue recibido", origin: "reported", category: "received" },
    ],
  } satisfies Record<"en" | "es", TimelineEvent[]>,
};

const shortDate = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } as const;

export function LandingCaseMock() {
  const t = useTranslations("landing.preview");
  const format = useFormatter();
  const locale = useLocale() === "es" ? "es" : "en";
  const events = sample.events[locale];
  const current = events[0];

  return (
    <div aria-label={t("ariaLabel")} role="img" className="relative">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
        {/* A slice of the signed-in top bar, so the card reads as the product and not as a brochure. */}
        <div className="flex h-11 items-center justify-between bg-ink px-5 text-white">
          <Logo tone="onDark" size="sm" />
          <span className="border-b-2 border-stamp pb-0.5 text-sm font-medium">{t("nav")}</span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-heading text-ink">{t("nickname")}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            <ReceiptNumber value={sample.receipt} size="sm" />
            <span aria-hidden="true">·</span>
            <span>{t("form", { form: sample.form })}</span>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-caps text-ink-muted">{t("statusLabel")}</p>
            <StatusIndicator label={current.title} category={current.category} size="lg" className="mt-2" />
            <p className="mt-2 max-w-[48ch] text-md text-ink">{t("meaning")}</p>
            <p className="mt-3 text-sm text-ink-muted">
              {t("checked", { date: format.dateTime(new Date(`${sample.lastChangeOn}T00:00:00Z`), shortDate) })}
            </p>
          </div>

          <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <p className="text-caps text-ink-muted">{t("keyDates")}</p>
              <KeyDateChip kind="appointment" date={sample.keyDate} now={sample.now} className="mt-2" />
            </div>
            <div className="min-w-0">
              <p className="text-caps text-ink-muted">{t("sharedWith")}</p>
              <p className="mt-2 truncate text-md font-medium text-ink">{sample.shareEmail}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <StatusDot tone="approved" />
                {t("shareActive", { date: format.dateTime(new Date(`${sample.shareSince}T00:00:00Z`), { month: "short", day: "numeric", timeZone: "UTC" }) })}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-caps mb-4 text-ink-muted">{t("timeline")}</p>
            <Timeline events={events} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-subtle">{t("caption")}</p>
    </div>
  );
}
