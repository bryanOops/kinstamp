"use client";

import { CalendarPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { googleCalendarUrl, outlookCalendarUrl, type CalendarLinkEvent } from "@/lib/calendar-links";
import { cn } from "@/lib/utils";

type AddToCalendarMenuProps = {
  event: CalendarLinkEvent;
  /** `.ics` route: Apple Calendar opens it directly; any other calendar app can import it. */
  icsHref: string;
};

/** One click to put a key date in Google Calendar or Outlook; Apple and others through the .ics file. */
export function AddToCalendarMenu({ event, icsHref }: AddToCalendarMenuProps) {
  const t = useTranslations("caseDetail.keyDates.calendar");
  const itemClass = "h-10 cursor-pointer rounded-lg px-2.5 text-md";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-ink-muted hover:text-ink aria-expanded:text-ink")}
        aria-label={t("open", { title: event.title })}
      >
        <CalendarPlusIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-overlay">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-medium text-ink-muted">{t("title")}</DropdownMenuLabel>
          <DropdownMenuItem render={<a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" />} className={itemClass}>
            {t("google")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer" />} className={itemClass}>
            {t("outlook")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={icsHref} />} className={itemClass}>
            {t("apple")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
