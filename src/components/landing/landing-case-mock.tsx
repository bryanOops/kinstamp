import { useFormatter, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { NoticeText } from "@/components/status/notice-text";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusDot, StatusIndicator } from "@/components/status/status-indicator";
import { Timeline, type TimelineEvent } from "@/components/status/timeline";

/**
 * The hero object: a case detail rendered with the app's own primitives, not a screenshot.
 * The receipt is a USCIS sandbox test receipt and the official text follows USCIS wording for
 * a request for evidence. `now` is pinned so the countdown and "checked today" are deterministic.
 */
const sample = {
  // Not one of the sandbox receipts, so the illustration never contradicts what a reviewer can add.
  receipt: "LIN9999106510",
  form: "I-765",
  category: "evidence_requested",
  now: new Date("2026-10-30T18:00:00Z"),
  lastChangeOn: "2026-10-02",
  keyDate: "2026-11-18",
  shareEmail: "ana@lawfirm.com",
  shareSince: "2026-10-12",
  events: [
    { id: "rfe", occurredOn: "2026-10-02", origin: "observed", category: "evidence_requested" },
    { id: "review", occurredOn: "2026-06-11", origin: "reported", category: "other" },
    { id: "fee", occurredOn: "2026-04-22", origin: "reported", category: "biometrics" },
    { id: "received", occurredOn: "2026-03-30", origin: "reported", category: "received" },
  ] as const,
};

const utc = { timeZone: "UTC" } as const;

export function LandingCaseMock({ className }: { className?: string }) {
  const t = useTranslations("landing.preview");
  const format = useFormatter();
  const events: TimelineEvent[] = sample.events.map((event) => ({ ...event, title: t(`events.${event.id}`) }));
  const keyDay = new Date(`${sample.keyDate}T00:00:00Z`);

  return (
    <figure aria-label={t("ariaLabel")} role="img" className={className}>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
        {/* A slice of the signed-in top bar, so the object reads as the product. */}
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
            <StatusIndicator label={t("status")} category={sample.category} size="lg" className="mt-2" />
            <p className="mt-2.5 max-w-[52ch] text-md text-ink">{t("meaning")}</p>
            <div className="mt-4 border-l border-line pl-4">
              <p className="text-caps text-ink-muted">{t("official")}</p>
              <NoticeText text={t("officialText")} className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-ink-muted" />
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              {t("checked", { date: format.dateTime(new Date(`${sample.lastChangeOn}T00:00:00Z`), { month: "short", day: "numeric", year: "numeric", ...utc }) })}
            </p>
          </div>

          <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <p className="text-caps text-ink-muted">{t("keyDates")}</p>
              <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
                <time dateTime={sample.keyDate} className="flex w-12 flex-col items-center rounded-lg border border-ink bg-ink py-1.5 tabular text-white">
                  <span className="text-caps leading-none">{format.dateTime(keyDay, { month: "short", ...utc })}</span>
                  <span className="mt-1 text-heading leading-none">{format.dateTime(keyDay, { day: "numeric", ...utc })}</span>
                  <span className="mt-1 text-[11px] leading-none">{format.dateTime(keyDay, { weekday: "short", ...utc })}</span>
                </time>
                <div className="min-w-0">
                  <p className="text-md font-medium text-ink">{t("keyDateTitle")}</p>
                  <KeyDateChip kind="due_date" date={sample.keyDate} now={sample.now} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-caps text-ink-muted">{t("sharedWith")}</p>
              <p className="mt-3 truncate text-md font-medium text-ink">{sample.shareEmail}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <StatusDot tone="approved" />
                {t("shareActive", { date: format.dateTime(new Date(`${sample.shareSince}T00:00:00Z`), { month: "short", day: "numeric", ...utc }) })}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-caps mb-4 text-ink-muted">{t("timeline")}</p>
            <Timeline events={events} highlightedEventId="rfe" />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-ink-subtle">{t("caption")}</figcaption>
    </figure>
  );
}
