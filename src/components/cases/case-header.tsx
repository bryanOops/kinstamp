import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { localizedText } from "./case-card";
import type { CaseDetail } from "./types";

type CaseHeaderProps = {
  detail: Pick<CaseDetail, "nickname" | "receiptNumber" | "formType" | "formTitle">;
  /** Refresh button, share button, assistant trigger… */
  actions?: ReactNode;
  /** `/cases` for clients, `/attorney` for attorneys. */
  backHref: string;
  backLabel: string;
};

export function CaseHeader({ detail, actions, backHref, backLabel }: CaseHeaderProps) {
  const t = useTranslations("caseDetail.header");
  const locale = useLocale();
  const formTitle = localizedText(detail.formTitle, locale);

  return (
    <PageHeader
      breadcrumbs={[{ label: backLabel, href: backHref }, { label: detail.nickname ?? detail.receiptNumber }]}
      title={detail.nickname ?? detail.receiptNumber}
      meta={
        <>
          <ReceiptNumber value={detail.receiptNumber} copyable />
          {detail.formType && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {t("form", { form: detail.formType })}
                {formTitle ? ` · ${formTitle}` : ""}
              </span>
            </>
          )}
        </>
      }
      actions={actions}
    />
  );
}
