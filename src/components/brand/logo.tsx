import { cn } from "@/lib/utils";

type LogoProps = {
  /** `onDark` for the black top bar, `onLight` for the public header and auth pages. */
  tone?: "onDark" | "onLight";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { mark: "size-4", text: "text-[17px]", gap: "gap-2" },
  md: { mark: "size-5", text: "text-[20px]", gap: "gap-2.5" },
  lg: { mark: "size-7", text: "text-[28px]", gap: "gap-3" },
} as const;

/** The stamp mark: a rounded square outline with a vermilion dot, like an inked stamp. */
export function StampMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2.25" />
      <circle cx="12" cy="12" r="3.5" className="fill-stamp" />
    </svg>
  );
}

export function Logo({ tone = "onLight", size = "md", className }: LogoProps) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-[-0.03em] select-none",
        s.gap,
        tone === "onDark" ? "text-white" : "text-ink",
        className,
      )}
    >
      <StampMark className={s.mark} />
      <span className={cn("leading-none", s.text)}>Kinstamp</span>
    </span>
  );
}
