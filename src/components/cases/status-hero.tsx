"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { StatusIndicator } from "@/components/status/status-indicator";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { isStatusCategory } from "@/lib/status-tone/status-tone";
import type { Bilingual, CaseDetail } from "./types";
import { NoticeText } from "@/components/status/notice-text";

type StatusHeroProps = {
  detail: Pick<CaseDetail, "status" | "description" | "statusCategory" | "checkState" | "lastChangeOn" | "lastSuccessfulCheckAt">;
  now: Date;
  /** The refresh control: black button plus its outcome line. */
  primaryAction?: ReactNode;
  /** Share and assistant triggers, rendered as one outline group. */
  secondaryActions?: ReactNode;
};

function pick(text: Bilingual | null, lang: "en" | "es"): string | null {
  if (!text) return null;
  return lang === "es" ? (text.es ?? text.en) : text.en;
}

/**
 * The lead of the case detail: the status as USCIS names it, what it means in plain
 * language, the official text underneath, when it was checked, and the actions.
 * The toggle reads the USCIS texts in the other language when USCIS provided it.
 */
export function StatusHero({ detail, now, primaryAction, secondaryActions }: StatusHeroProps) {
  const t = useTranslations("caseDetail.status");
  const plainT = useTranslations("caseDetail.plain");
  const locale = useLocale() === "es" ? "es" : "en";
  const format = useFormatter();
  const [lang, setLang] = useState<"en" | "es">(locale);
  const other = lang === "en" ? "es" : "en";
  const hasOther = Boolean(detail.status && (other === "es" ? detail.status.es : detail.status.en));

  const status = pick(detail.status, lang);
  const description = pick(detail.description, lang);
  const awaiting = detail.checkState === "awaiting_first_check" || !status;
  const plainKey = isStatusCategory(detail.statusCategory) ? detail.statusCategory : "other";

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <p className="text-caps text-ink-muted">{t("title")}</p>
        {hasOther && !awaiting && (
          <button
            type="button"
            onClick={() => setLang(other)}
            className="hit-area cursor-pointer rounded-md text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-stamp-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            lang={other}
          >
            {t(`readIn.${other}`)}
          </button>
        )}
      </CardHeader>

      <CardContent>
        {awaiting ? (
          <>
            <StatusIndicator label={t("awaiting.title")} category={null} size="lg" />
            <p className="mt-3 max-w-[60ch] text-md text-ink-muted">{t("awaiting.description")}</p>
          </>
        ) : (
          <>
            <div lang={lang}>
              <StatusIndicator label={status} category={detail.statusCategory} size="lg" />
            </div>
            <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink sm:text-lg">{plainT(`${plainKey}.meaning`)}</p>
            {description && (
              <div lang={lang} className="mt-5 border-l border-line pl-4">
                <p className="text-caps text-ink-muted">{t("official")}</p>
                <NoticeText text={description} className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-ink-muted [overflow-wrap:anywhere]" />
              </div>
            )}
            <p className="mt-4 text-xs text-ink-subtle">{plainT("disclaimer")}</p>
          </>
        )}
        {(detail.lastSuccessfulCheckAt || detail.lastChangeOn) && (
          <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-4 text-sm text-ink-muted">
            {detail.lastSuccessfulCheckAt && <span>{t("checked", { time: format.relativeTime(new Date(detail.lastSuccessfulCheckAt), now) })}</span>}
            {detail.lastSuccessfulCheckAt && detail.lastChangeOn && <span aria-hidden="true">·</span>}
            {detail.lastChangeOn && (
              <span>{t("lastChange", { date: format.dateTime(new Date(`${detail.lastChangeOn}T00:00:00Z`), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) })}</span>
            )}
          </p>
        )}
      </CardContent>

      {(primaryAction || secondaryActions) && (
        // Phones: refresh first, then the outline actions, every button full width. From `sm`: one row.
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
          {secondaryActions && <div className="flex flex-col gap-2 *:w-full sm:flex-row sm:flex-wrap sm:*:w-auto">{secondaryActions}</div>}
          {primaryAction && <div className="order-first sm:order-none sm:ml-auto">{primaryAction}</div>}
        </CardFooter>
      )}
    </Card>
  );
}
