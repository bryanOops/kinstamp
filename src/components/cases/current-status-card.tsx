"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { StatusIndicator } from "@/components/status/status-indicator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Bilingual, CaseDetail } from "./types";

type CurrentStatusCardProps = {
  detail: Pick<CaseDetail, "status" | "description" | "statusCategory" | "checkState" | "lastChangeAt" | "lastSuccessfulCheckAt">;
  now: Date;
};

function pick(text: Bilingual | null, lang: "en" | "es"): string | null {
  if (!text) return null;
  return lang === "es" ? (text.es ?? text.en) : text.en;
}

/** The status as USCIS gives it, with a toggle to read it in the other language. */
export function CurrentStatusCard({ detail, now }: CurrentStatusCardProps) {
  const t = useTranslations("caseDetail.status");
  const locale = useLocale() === "es" ? "es" : "en";
  const format = useFormatter();
  const [lang, setLang] = useState<"en" | "es">(locale);
  const other = lang === "en" ? "es" : "en";
  const hasOther = Boolean(detail.status && (other === "es" ? detail.status.es : detail.status.en));

  const status = pick(detail.status, lang);
  const description = pick(detail.description, lang);
  const awaiting = detail.checkState === "awaiting_first_check" || !status;

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <p className="text-caps text-ink-muted">{t("title")}</p>
        {hasOther && !awaiting && (
          <button
            type="button"
            onClick={() => setLang(other)}
            className="cursor-pointer rounded-md text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-stamp-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            lang={other}
          >
            {t(`readIn.${other}`)}
          </button>
        )}
      </CardHeader>
      <CardContent lang={awaiting ? undefined : lang}>
        {awaiting ? (
          <>
            <StatusIndicator label={t("awaiting.title")} category={null} size="lg" />
            <p className="mt-3 max-w-[60ch] text-md text-ink-muted">{t("awaiting.description")}</p>
          </>
        ) : (
          <>
            <StatusIndicator label={status} category={detail.statusCategory} size="lg" />
            {description && <p className="mt-4 max-w-[68ch] text-md leading-relaxed text-ink">{description}</p>}
          </>
        )}
        <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-4 text-sm text-ink-muted">
          {detail.lastSuccessfulCheckAt && (
            <span>{t("checked", { time: format.relativeTime(new Date(detail.lastSuccessfulCheckAt), now) })}</span>
          )}
          {detail.lastChangeAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("lastChange", { date: format.dateTime(new Date(detail.lastChangeAt), { month: "short", day: "numeric", year: "numeric" }) })}</span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
