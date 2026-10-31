import { MailIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { mailtoHref } from "@/lib/attorney/mailto";
import { initialsOf } from "@/lib/format/initials";
import { cn } from "@/lib/utils";

type ClientIdentityProps = {
  clientName: string;
  clientEmail: string;
  /** When the active share to this attorney was created. */
  sharedAt: string;
  /** Case nickname, or the receipt number without one; used in the email subject. */
  caseLabel: string;
};

/**
 * Who shared this case, as one quiet row inside the header band of the attorney case detail: an
 * initials disc, the name, the email with "Shared since …" and a "Write to client" link. The client
 * chose to share the case, so their email is shown (read through `shared_case_client`, never profiles).
 */
export function ClientIdentity({ clientName, clientEmail, sharedAt, caseLabel }: ClientIdentityProps) {
  const t = useTranslations("attorney.client");
  const format = useFormatter();
  const name = clientName || clientEmail;

  return (
    <div data-tour="client-contact" className="flex items-center justify-between gap-3 sm:gap-6">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas-deep text-sm font-semibold tracking-[0.02em] text-ink">
          {initialsOf(clientName, clientEmail)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-md font-semibold text-ink">
            <span className="sr-only">{t("label")}: </span>
            {name}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-muted">
            <span className="truncate">{clientEmail}</span>
            <span aria-hidden="true" className="max-sm:hidden">
              ·
            </span>
            <span className="max-sm:hidden">{t("sharedSince", { date: format.dateTime(new Date(sharedAt), { month: "short", day: "numeric", year: "numeric" }) })}</span>
          </p>
        </div>
      </div>
      <a
        href={mailtoHref(clientEmail, t("emailSubject", { case: caseLabel }))}
        aria-label={t("write")}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 max-sm:w-11 max-sm:px-0")}
      >
        <MailIcon aria-hidden="true" />
        <span className="max-sm:sr-only">{t("write")}</span>
      </a>
    </div>
  );
}
