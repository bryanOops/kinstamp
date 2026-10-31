"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CaseSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
};

/** Whether the focused element already takes keystrokes, so `/` must not steal them. */
function isTyping(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

/**
 * The case-list search field: icon, `type="search"`, a clear button once there is text and a
 * `/` hint on desktop. Controlled by the caller, who owns the draft and the debounce.
 */
export function CaseSearch({ value, onChange, onClear, className }: CaseSearchProps) {
  const t = useTranslations("cases.search");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the field when nothing else is taking keys, as on GitHub and Gmail.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function clear() {
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            clear();
          }
        }}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        aria-keyshortcuts="/"
        autoComplete="off"
        spellCheck={false}
        className="h-11 pr-11 pl-10 md:h-10 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("clear")}
          onClick={clear}
          className="absolute top-1/2 right-0 -translate-y-1/2 text-ink-muted hover:text-ink sm:right-0.5"
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : (
        <kbd
          aria-hidden="true"
          title={t("shortcut")}
          className="pointer-events-none absolute top-1/2 right-3 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-canvas px-1.5 font-mono text-xs text-ink-muted sm:inline-flex"
        >
          /
        </kbd>
      )}
    </div>
  );
}
