import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStatusCategory } from "@/lib/status-tone/status-tone";

type PlainEnglishCardProps = {
  category: string | null;
};

/**
 * What the current status means and what usually comes next, per status category.
 * Copy lives in the message files under `plain.<category>`; unknown categories get a generic text.
 */
export function PlainEnglishCard({ category }: PlainEnglishCardProps) {
  const t = useTranslations("caseDetail.plain");
  const key = isStatusCategory(category) ? category : "other";
  const next = [1, 2, 3].map((i) => `${key}.next.${i}`).filter((k) => t.has(k));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="max-w-[64ch] text-md leading-relaxed text-ink">{t(`${key}.meaning`)}</p>
        {next.length > 0 && (
          <div>
            <p className="text-caps text-ink-muted">{t("nextTitle")}</p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {next.map((k, i) => (
                <li key={k} className="flex gap-3 text-md text-ink">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold tabular text-ink-muted">
                    {i + 1}
                  </span>
                  <span className="max-w-[60ch]">{t(k)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}
