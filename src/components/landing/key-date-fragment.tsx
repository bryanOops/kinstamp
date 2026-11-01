import { CalendarPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { KeyDateRow } from "@/components/cases/key-date-row";
import type { KeyDate } from "@/components/cases/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const now = new Date("2026-10-30T18:00:00Z");

/**
 * The app's key-date rows beside the "Add to calendar" menu drawn open, so the two sit together
 * as one gesture: the date on the notice, then the calendar it lands in.
 */
export function KeyDateFragment() {
  const t = useTranslations("landing.keyDates.rows");
  const kd = useTranslations("caseDetail.keyDates");

  const keyDates: KeyDate[] = [
    { id: "kd_1", kind: "due_date", date: "2026-11-18", time: null, title: t("rfe"), notes: null, canDelete: false },
    { id: "kd_2", kind: "appointment", date: "2026-12-04", time: "09:30", title: t("biometrics"), notes: null, canDelete: false },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>{kd("title")}</CardTitle>
          <CardDescription>{t("summary")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="-my-3.5 divide-y divide-line">
            {keyDates.map((keyDate, index) => (
              <KeyDateRow
                key={keyDate.id}
                keyDate={keyDate}
                now={now}
                highlighted={index === 0}
                actions={
                  <span
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      index === 0 ? "bg-muted text-ink" : "text-ink-muted",
                    )}
                  >
                    <CalendarPlusIcon />
                  </span>
                }
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* The menu as it opens from the first row's calendar button. */}
      <div className="relative z-10 -mt-6 mr-3 w-64 justify-self-end rounded-xl border border-line bg-surface p-1.5 shadow-overlay lg:mt-16 lg:mr-0 lg:-ml-10 lg:justify-self-auto">
        <p className="px-2.5 py-1.5 text-xs font-medium text-ink-muted">{kd("calendar.title")}</p>
        <ul>
          {(["google", "outlook", "apple"] as const).map((item, index) => (
            <li
              key={item}
              className={cn("flex h-10 items-center rounded-lg px-2.5 text-md text-ink", index === 0 && "bg-muted")}
            >
              {kd(`calendar.${item}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
