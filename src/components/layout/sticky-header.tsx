"use client";

import type { ReactNode } from "react";
import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

type StickyHeaderProps = {
  /** `dark` is the signed-in black bar; `light` the public canvas bar. */
  tone: "dark" | "light";
  children: ReactNode;
  className?: string;
};

/**
 * Sticky top bar with a translucent backdrop. The hairline under it only appears
 * once the page has scrolled, so the bar sits flush with the canvas at the top.
 */
export function StickyHeader({ tone, children, className }: StickyHeaderProps) {
  const scrolled = useScrolled();
  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 border-b pt-safe backdrop-blur-md transition-[border-color] duration-(--duration-base)",
        tone === "dark"
          ? "bg-ink/85 text-white not-supports-[backdrop-filter]:bg-ink"
          : "bg-canvas/80 text-ink not-supports-[backdrop-filter]:bg-canvas",
        scrolled ? (tone === "dark" ? "border-white/10" : "border-line") : "border-transparent",
        className,
      )}
    >
      {children}
    </header>
  );
}
