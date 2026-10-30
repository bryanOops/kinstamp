import { CalendarPlusIcon, DownloadIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KeyDate } from "./types";

type KeyDatesCardProps = {
  keyDates: KeyDate[];
  now: Date;
  /** Trigger of the add-key-date form, provided by the data layer. */
  addAction?: ReactNode;
  /** Builds the `.ics` download URL for a key date. */
  icsHref?: (keyDate: KeyDate) => string;
  onDelete?: (keyDate: KeyDate) => void;
};

export function KeyDatesCard({ keyDates, now, addAction, icsHref, onDelete }: KeyDatesCardProps) {
  const t = useTranslations("caseDetail.keyDates");
  const format = useFormatter();
  const sorted = [...keyDates].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        {addAction && <CardAction>{addAction}</CardAction>}
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-md text-ink-muted">{t("empty")}</p>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {sorted.map((keyDate) => (
              <li key={keyDate.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-1 last:pb-1">
                <div className="min-w-0">
                  <p className="text-md font-medium text-ink">{keyDate.title}</p>
                  <p className="mt-0.5 text-sm tabular text-ink-muted">
                    {format.dateTime(new Date(`${keyDate.date}T${keyDate.time ?? "00:00"}:00`), {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      ...(keyDate.time ? { hour: "numeric", minute: "2-digit" } : {}),
                    })}
                    {" · "}
                    {t(`kind.${keyDate.kind}`)}
                  </p>
                  {keyDate.notes && <p className="mt-1 max-w-[52ch] text-sm text-ink-muted">{keyDate.notes}</p>}
                  <KeyDateChip kind={keyDate.kind} date={keyDate.date} now={now} className="mt-2" />
                </div>
                <div className="flex items-center gap-1">
                  {icsHref && (
                    <Button variant="ghost" size="icon-sm" render={<a href={icsHref(keyDate)} download />} aria-label={t("download", { title: keyDate.title })}>
                      <DownloadIcon aria-hidden="true" />
                    </Button>
                  )}
                  {keyDate.canDelete && onDelete && (
                    <Button variant="ghost" size="icon-sm" className="text-ink-muted hover:text-destructive" onClick={() => onDelete(keyDate)} aria-label={t("delete", { title: keyDate.title })}>
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Default trigger for the add form, exported so the data layer can reuse it. */
export function AddKeyDateButton(props: React.ComponentProps<typeof Button>) {
  const t = useTranslations("caseDetail.keyDates");
  return (
    <Button variant="outline" size="sm" {...props}>
      <CalendarPlusIcon aria-hidden="true" />
      {t("add")}
    </Button>
  );
}
