"use client";

import { CircleHelpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { replayCurrentTour, useAvailableTour } from "./tour-store";

/** "?" in the top bar: replays the guided tour of the current page. Hidden on pages without one. */
export function HelpButton() {
  const t = useTranslations("tour");
  const available = useAvailableTour();
  if (!available) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("help")}
            onClick={replayCurrentTour}
            className="text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-white/80 focus-visible:ring-offset-ink"
          />
        }
      >
        <CircleHelpIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{t("helpTooltip")}</TooltipContent>
    </Tooltip>
  );
}
