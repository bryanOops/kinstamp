import { useTranslations } from "next-intl";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { Timeline, type TimelineEvent } from "@/components/status/timeline";

/**
 * A full timeline for a USCIS sandbox receipt: the descriptions of the received and approved
 * events are the sentences the sandbox returns for that receipt, word for word.
 */
const sample = {
  receipt: "EAC9999103403",
  form: "I-130",
  events: [
    { id: "approved", occurredOn: "2026-10-28", origin: "observed", category: "approved", described: true },
    { id: "review", occurredOn: "2026-07-14", origin: "reported", category: "other", described: false },
    { id: "fee", occurredOn: "2026-02-03", origin: "reported", category: "biometrics", described: false },
    { id: "received", occurredOn: "2025-11-12", origin: "reported", category: "received", described: true },
  ] as const,
};

export function TimelineFragment() {
  const t = useTranslations("landing.timeline.case");
  const events: TimelineEvent[] = sample.events.map(({ described, ...event }) => ({
    ...event,
    title: t(`events.${event.id}.title`),
    description: described ? t(`events.${event.id}.description`) : null,
  }));

  return (
    <div className="rounded-2xl border border-line bg-canvas p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-5">
        <p className="text-heading text-ink">{t("nickname")}</p>
        <p className="flex items-center gap-3 text-sm text-ink-muted">
          <ReceiptNumber value={sample.receipt} size="sm" />
          <span>{t("form", { form: sample.form })}</span>
        </p>
      </div>
      <Timeline events={events} highlightedEventId="approved" className="mt-6 [&_.ring-surface]:ring-canvas" />
    </div>
  );
}
