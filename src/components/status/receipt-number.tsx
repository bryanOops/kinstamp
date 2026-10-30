"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { groupReceiptNumber, normalizeReceiptNumber } from "@/lib/format/receipt";
import { cn } from "@/lib/utils";

type ReceiptNumberProps = {
  value: string;
  /** Show the copy button. The copied value is the raw receipt without spaces. */
  copyable?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function ReceiptNumber({ value, copyable = false, size = "md", className }: ReceiptNumberProps) {
  const t = useTranslations("receipt");
  const [copied, setCopied] = useState(false);
  const grouped = groupReceiptNumber(value);
  const raw = normalizeReceiptNumber(value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context); the number stays selectable.
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <code
        className={cn(
          "font-mono tabular tracking-[0.04em] text-ink",
          size === "sm" ? "text-[13px]" : "text-sm",
        )}
        aria-label={t("ariaLabel", { value: raw })}
      >
        {grouped}
      </code>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          className="hit-area inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-muted transition-colors duration-(--duration-fast) hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={copied ? t("copied") : t("copy")}
        >
          {copied ? <CheckIcon className="size-3.5 text-status-approved" /> : <CopyIcon className="size-3.5" />}
          <span aria-live="polite" className="sr-only">
            {copied ? t("copied") : ""}
          </span>
        </button>
      )}
    </span>
  );
}
