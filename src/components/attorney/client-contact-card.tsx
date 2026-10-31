import { MailIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mailtoHref } from "@/lib/attorney/mailto";
import { cn } from "@/lib/utils";

type ClientContactCardProps = {
  clientName: string;
  clientEmail: string;
  /** When the active share to this attorney was created. */
  sharedAt: string;
  /** Case nickname, or the receipt number without one; used in the email subject. */
  caseLabel: string;
};

/**
 * Who shared this case, above the status on the attorney case detail. The client chose to share the
 * case with this attorney, so their email is shown (read through `shared_case_client`, never profiles).
 */
export function ClientContactCard({ clientName, clientEmail, sharedAt, caseLabel }: ClientContactCardProps) {
  const t = useTranslations("attorney.client");
  const format = useFormatter();

  return (
    <Card size="sm" data-tour="client-contact" className="px-(--card-spacing) sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-caps text-ink-muted">{t("label")}</p>
        <p className="mt-1 text-subheading text-ink">{clientName || clientEmail}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-muted">
          <span className="break-all">{clientEmail}</span>
          <span aria-hidden="true">·</span>
          <span>{t("sharedSince", { date: format.dateTime(new Date(sharedAt), { month: "short", day: "numeric", year: "numeric" }) })}</span>
        </p>
      </div>
      <a href={mailtoHref(clientEmail, t("emailSubject", { case: caseLabel }))} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full sm:w-auto")}>
        <MailIcon aria-hidden="true" />
        {t("write")}
      </a>
    </Card>
  );
}
