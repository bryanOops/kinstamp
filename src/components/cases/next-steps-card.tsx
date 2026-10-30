import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStatusCategory } from "@/lib/status-tone/status-tone";

type NextStepsCardProps = {
  category: string | null;
};

/**
 * What usually comes after the current status, per status category. The plain-language
 * meaning itself lives in the status hero; this card only lists the next steps.
 * Copy lives in the message files under `plain.<category>.next`.
 */
export function NextStepsCard({ category }: NextStepsCardProps) {
  const t = useTranslations("caseDetail.plain");
  const key = isStatusCategory(category) ? category : "other";
  const next = [1, 2, 3].map((i) => `${key}.next.${i}`).filter((k) => t.has(k));

  if (next.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("nextTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ol className="flex flex-col gap-2.5">
          {next.map((k, i) => (
            <li key={k} className="flex gap-3 text-md text-ink">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold tabular text-ink-muted">
                {i + 1}
              </span>
              <span className="max-w-[60ch]">{t(k)}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}
