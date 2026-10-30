"use client";

import { ArrowUpIcon, MessageSquareTextIcon, SquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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
  /** A reply is streaming in. */
  streaming?: boolean;
  /** i18n key under `assistant.errors`, shown instead of a reply. */
  error?: string | null;
  onSend?: (question: string) => void;
  onStop?: () => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** "Ask about this case": a side panel chat over the case's own data. Not legal advice. */
export function AssistantPanel({ caseLabel, messages, suggestions = [], streaming = false, error, onSend, onStop, trigger, open, onOpenChange }: AssistantPanelProps) {
  const t = useTranslations("assistant");
  const errorsT = useTranslations("assistant.errors");
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastContent = messages.at(-1)?.content ?? "";

  // Follow new text only while the person is already at the bottom; respect scrolling up.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && stickToBottom.current) log.scrollTop = log.scrollHeight;
  }, [messages.length, lastContent]);

  function onScroll() {
    const log = logRef.current;
    if (!log) return;
    stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 24;
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || streaming) return;
    stickToBottom.current = true;
    onSend?.(question);
    setDraft("");
  }

  const showSuggestions = suggestions.length > 0 && messages.length === 0;

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

        <div ref={logRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-5 py-5" aria-live="polite" aria-busy={streaming || undefined}>
          {messages.length === 0 && !error ? (
            <p className="text-md text-ink-muted">{t("empty")}</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message) => {
                const thinking = message.role === "assistant" && message.content.length === 0;
                return (
                  <li key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-md leading-relaxed whitespace-pre-line",
                        message.role === "user" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-surface text-ink",
                      )}
                      aria-label={thinking ? t("thinking") : undefined}
                    >
                      <span className="sr-only">{message.role === "user" ? t("you") : t("assistant")}: </span>
                      {thinking ? <span className="progress-line my-2 block w-16 rounded-full" /> : message.content}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink">
              {errorsT.has(error) ? errorsT(error) : errorsT("network")}
            </p>
          )}
          <p className="mt-5 text-xs text-ink-subtle">{t("disclaimer")}</p>
        </div>

        <div className="border-t border-line bg-canvas/60 px-5 py-4">
          {showSuggestions && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      stickToBottom.current = true;
                      onSend?.(s);
                    }}
                    disabled={streaming}
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
              maxLength={2000}
              className="min-h-11 flex-1 resize-none"
            />
            {streaming ? (
              <Button type="button" variant="outline" size="icon" onClick={onStop} aria-label={t("stop")}>
                <SquareIcon aria-hidden="true" className="fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={draft.trim().length === 0} aria-label={t("send")}>
                <ArrowUpIcon aria-hidden="true" />
              </Button>
            )}
          </form>
          <p className="mt-2 text-xs text-ink-muted">{t("notStored")}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
