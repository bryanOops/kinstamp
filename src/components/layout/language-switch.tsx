"use client";

import { useLocale, useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { locales, type Locale } from "@/i18n/config";
import { setLocale } from "@/server/actions/locale";
import { cn } from "@/lib/utils";

type LanguageSwitchProps = {
  tone?: "onDark" | "onLight";
  className?: string;
};

/** Segmented EN / ES control. The choice is saved in a cookie and, when signed in, in the profile. */
export function LanguageSwitch({ tone = "onLight", className }: LanguageSwitchProps) {
  const t = useTranslations("language");
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(current);

  function choose(locale: Locale) {
    if (locale === optimistic) return;
    startTransition(async () => {
      setOptimistic(locale);
      await setLocale(locale);
    });
  }

  const dark = tone === "onDark";

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-lg p-0.5 text-xs font-semibold",
        dark ? "bg-white/10" : "bg-canvas-deep",
        className,
      )}
    >
      {locales.map((locale) => {
        const active = locale === optimistic;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={active}
            lang={locale}
            onClick={() => choose(locale)}
            className={cn(
              "h-full min-w-10 cursor-pointer rounded-[6px] px-2.5 uppercase tracking-[0.04em] transition-[background-color,color] duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
              dark
                ? active
                  ? "bg-white text-ink"
                  : "text-white/70 hover:text-white"
                : active
                  ? "bg-surface text-ink shadow-card"
                  : "text-ink-muted hover:text-ink",
            )}
          >
            {t(`short.${locale}`)}
            <span className="sr-only">, {t(`name.${locale}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
