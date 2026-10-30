"use client";

import { ArrowUpIcon, MessageSquareTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AssistantPanelProps = {
  /** Case nickname (or receipt) shown in the header. */
  caseLabel: string;
  messages: AssistantMessage[];
  suggestions?: string[];
  /** Streaming or thinking. */
  pending?: boolean;
  /** Remaining questions today, when the data layer knows it. */
  remaining?: number | null;
  onSend?: (question: string) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** "Ask about this case": a side panel chat over the case's own data. Not legal advice. */
export function AssistantPanel({ caseLabel, messages, suggestions = [], pending, remaining, onSend, trigger, open, onOpenChange }: AssistantPanelProps) {
  const t = useTranslations("assistant");
  const [draft, setDraft] = useState("");
  const inputId = useId();

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || pending) return;
    onSend?.(question);
    setDraft("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        nativeButton={!trigger}
        render={
          trigger ? (
            <span />
          ) : (
            <Button variant="outline">
              <MessageSquareTextIcon aria-hidden="true" />
              {t("trigger")}
            </Button>
          )
        }
      >
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line px-5 py-4 text-left">
          <SheetTitle className="text-heading">{t("title")}</SheetTitle>
          <SheetDescription className="text-sm text-ink-muted">{t("about", { case: caseLabel })}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 ? (
            <p className="text-md text-ink-muted">{t("empty")}</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message) => (
                <li key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-md leading-relaxed whitespace-pre-line",
                      message.role === "user" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-surface text-ink",
                    )}
                  >
                    <span className="sr-only">{message.role === "user" ? t("you") : t("assistant")}: </span>
                    {message.content}
                  </div>
                </li>
              ))}
              {pending && (
                <li className="flex justify-start" aria-label={t("thinking")}>
                  <div className="rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3">
                    <span className="progress-line block w-16 rounded-full" />
                  </div>
                </li>
              )}
            </ol>
          )}
          <p className="mt-5 text-xs text-ink-subtle">{t("disclaimer")}</p>
        </div>

        <div className="border-t border-line bg-canvas/60 px-5 py-4">
          {suggestions.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => onSend?.(s)}
                    disabled={pending}
                    className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-(--duration-fast) hover:border-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submit} className="flex items-end gap-2">
            <label htmlFor={inputId} className="sr-only">
              {t("inputLabel")}
            </label>
            <Textarea
              id={inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
              placeholder={t("placeholder")}
              rows={1}
              className="min-h-11 flex-1 resize-none"
            />
            <Button type="submit" size="icon" disabled={pending || draft.trim().length === 0} aria-label={t("send")}>
              <ArrowUpIcon aria-hidden="true" />
            </Button>
          </form>
          {typeof remaining === "number" && <p className="mt-2 text-xs text-ink-muted">{t("remaining", { count: remaining })}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
