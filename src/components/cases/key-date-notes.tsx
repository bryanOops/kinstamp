"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Notes longer than this (or with line breaks) get a More / Less toggle under the two clamped lines. */
const LONG_NOTES = 72;

/** A key date's notes, clamped to two lines until the person asks for more. */
export function KeyDateNotes({ notes, className }: { notes: string; className?: string }) {
  const t = useTranslations("caseDetail.keyDates");
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const long = notes.length > LONG_NOTES || notes.includes("\n");

  return (
    <div className={className}>
      <p id={id} className={cn("text-sm whitespace-pre-line text-ink-muted", !expanded && "line-clamp-2")}>
        {notes}
      </p>
      {long && (
        <button
          type="button"
          className="hit-area mt-0.5 text-sm font-medium text-ink underline underline-offset-4 outline-none hover:text-stamp-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("notesLess") : t("notesMore")}
        </button>
      )}
    </div>
  );
}
