import { useTranslations } from "next-intl";
import { SlowCard } from "@/components/cases/slow-card";
import { ReceiptNumber } from "@/components/status/receipt-number";

/**
 * The app's own "Is my case slow?" card for a sandbox I-130 that has waited 20 months,
 * against the figure Kinstamp has on file for that form (src/data/official-processing-times.json).
 */
const sample = {
  receipt: "EAC9999103402",
  form: "I-130",
  receivedOn: "2025-02-28",
  now: new Date("2026-10-30T18:00:00Z"),
  officialTime: { formType: "I-130", months: 83.5, sourceUrl: "https://egov.uscis.gov/processing-times/", readOn: "2026-10-30" },
};

export function SlowFragment() {
  const t = useTranslations("landing.slow.case");

  return (
    <div className="mx-auto max-w-[32rem] lg:mx-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <p className="text-subheading text-ink">{t("nickname")}</p>
        <p className="flex items-center gap-3 text-sm text-ink-muted">
          <ReceiptNumber value={sample.receipt} size="sm" />
          <span>{t("form", { form: sample.form })}</span>
        </p>
      </div>
      <SlowCard receivedOn={sample.receivedOn} officialTime={sample.officialTime} now={sample.now} />
    </div>
  );
}
