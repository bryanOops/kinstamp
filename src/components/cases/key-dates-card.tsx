import { CalendarPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupKeyDates } from "@/lib/cases/key-dates";
import { cn } from "@/lib/utils";
import { KeyDateRow } from "./key-date-row";
import { KeyDatesList } from "./key-dates-list";
import type { KeyDate } from "./types";

type KeyDatesCardProps = {
  keyDates: KeyDate[];
  now: Date;
  /** Trigger of the add-key-date form. */
  addAction?: ReactNode;
  /** Builds the `.ics` download URL for a key date. */
  icsHref?: (keyDate: KeyDate) => string;
  /** Extra per-row controls (e.g. a delete button) rendered after the download link. */
  rowActions?: (keyDate: KeyDate) => ReactNode;
};

/**
 * Key dates of a case: upcoming first (the soonest highlighted), past ones collapsed at the
 * bottom. Rows are rendered here, on the server, and handed to the client list that owns the
 * "Show all" and "Past" toggles.
 */
export function KeyDatesCard({ keyDates, now, addAction, icsHref, rowActions }: KeyDatesCardProps) {
  const t = useTranslations("caseDetail.keyDates");
  const { upcoming, past } = groupKeyDates(keyDates, now);
  const row = (keyDate: KeyDate, options: { highlighted?: boolean; past?: boolean }) => (
    <KeyDateRow key={keyDate.id} keyDate={keyDate} now={now} icsHref={icsHref?.(keyDate)} actions={rowActions?.(keyDate)} {...options} />
  );

  return (
    <Card data-tour="key-dates">
      <CardHeader>
        <CardTitle>
          {t("title")}
          {keyDates.length > 0 && (
            <span className="ml-1.5 font-normal tabular text-ink-muted">
              <span aria-hidden="true">({keyDates.length})</span>
              <span className="sr-only">, {t("count", { count: keyDates.length })}</span>
            </span>
          )}
        </CardTitle>
        {addAction && <CardAction>{addAction}</CardAction>}
      </CardHeader>
      <CardContent>
        {keyDates.length === 0 ? (
          <p className="text-md text-ink-muted">{t("empty")}</p>
        ) : (
          <KeyDatesList upcoming={upcoming.map((keyDate, index) => row(keyDate, { highlighted: index === 0 }))} past={past.map((keyDate) => row(keyDate, { past: true }))} />
        )}
      </CardContent>
    </Card>
  );
}

/** Default trigger for the add form: full label from `sm`, icon-only (44px, labelled) on phones. */
export function AddKeyDateButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const t = useTranslations("caseDetail.keyDates");
  return (
    <Button variant="outline" size="sm" aria-label={t("add")} className={cn("max-sm:w-11 max-sm:px-0", className)} {...props}>
      <CalendarPlusIcon aria-hidden="true" />
      <span className="max-sm:sr-only">{t("add")}</span>
    </Button>
  );
}
