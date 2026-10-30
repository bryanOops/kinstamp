import { ArrowDownIcon, MailIcon, RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusDot, StatusIndicator } from "@/components/status/status-indicator";

const steps = ["add", "check", "share"] as const;
type Step = (typeof steps)[number];

const sampleReceipt = "EAC9999103403";
const sampleEmail = "attorney@example.com";

/** Small product vignettes built from the same primitives as the app, one per step. */
function StepIllustration({ step }: { step: Step }) {
  const t = useTranslations("landing.how");

  if (step === "add") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-caps text-ink-muted">{t("add.mockLabel")}</p>
        <div className="flex h-11 items-center rounded-lg border border-line-strong bg-surface px-3 whitespace-nowrap">
          <ReceiptNumber value={sampleReceipt} size="sm" />
        </div>
        <p className="text-caps mt-1 text-ink-muted">{t("add.mockNickname")}</p>
        <div className="flex h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-md text-ink">{t("add.mockValue")}</div>
      </div>
    );
  }

  if (step === "check") {
    return (
      <div className="flex flex-col gap-2">
        <StatusIndicator label={t("check.mockBefore")} category="received" size="sm" className="text-ink-muted" />
        <div className="flex items-center gap-2 text-ink-muted">
          <ArrowDownIcon className="ml-0.5 size-3.5" aria-hidden="true" />
          <RefreshCwIcon className="size-3.5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
          <StatusIndicator label={t("check.mockAfter")} category="biometrics" size="sm" className="font-medium" />
          <span className="rounded-md bg-stamp-tint px-1.5 py-0.5 text-xs font-semibold text-stamp-ink">{t("check.mockChanged")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <MailIcon className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{sampleEmail}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <StatusDot tone="approved" />
            {t("share.mockActive")}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium text-ink underline underline-offset-4">{t("share.mockRevoke")}</span>
    </div>
  );
}

/** Three numbered steps, each with a number, a rule and a vignette, so the row reads as a sequence. */
export function HowItWorks() {
  const t = useTranslations("landing.how");

  return (
    // From `sm` each step spans four subgrid rows (number, vignette, title, body) so the titles line up across columns.
    <ol className="grid gap-10 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
      {steps.map((step, index) => (
        <li key={step} className="flex flex-col sm:row-span-4 sm:grid sm:grid-rows-subgrid">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold tabular text-white">
              {index + 1}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
          <div aria-hidden="true" className="mt-5 flex min-h-[9.5rem] flex-col justify-center rounded-xl border border-line bg-canvas p-4">
            <StepIllustration step={step} />
          </div>
          <h3 className="text-subheading mt-5 text-ink">{t(`${step}.title`)}</h3>
          <p className="mt-1.5 text-sm text-ink-muted">{t(`${step}.body`)}</p>
        </li>
      ))}
    </ol>
  );
}
