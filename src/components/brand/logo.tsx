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

type MarkProps = {
  className?: string;
  /** Single-color rendering (favicons on tinted tiles, print): the accent takes `currentColor`. */
  monochrome?: boolean;
};

const accent = (monochrome?: boolean) => (monochrome ? "fill-current" : "fill-stamp");

/**
 * The stamp mark: a postmark ring with a check, open at the top right where the
 * ink dot sits. Reads at 16px (favicon) and 160px (empty states); strokes stay 2.25.
 */
export function StampMark({ className, monochrome }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      {/* Ring with a gap between 10 and 2 o'clock, drawn as one arc so the ends stay round. */}
      <path
        d="M16.6 4.3A9 9 0 1 0 19.7 7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path d="M7.9 12.4l2.7 2.7 5.6-5.7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19.3" cy="4.7" r="2.4" className={accent(monochrome)} />
    </svg>
  );
}

/** Candidate B: a receipt stub, with the perforation drawn in vermilion. */
export function StubMark({ className, monochrome }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <path
        d="M4.5 5h9.1a2.4 2.4 0 0 0 4.8 0h1.1A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-1.1a2.4 2.4 0 0 0-4.8 0H4.5A2.5 2.5 0 0 1 2 16.5v-9A2.5 2.5 0 0 1 4.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.6v4.8"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="0.1 2.6"
        className={monochrome ? "stroke-current" : "stroke-stamp"}
      />
      <path d="M6.5 9.5h4M6.5 13.5h3" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

/** Candidate C: three stages on a line, the latest one in vermilion. */
export function TimelineMark({ className, monochrome }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M4 18 12 12l8-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="18" r="2.6" fill="currentColor" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <circle cx="20" cy="6" r="3.4" className={accent(monochrome)} />
    </svg>
  );
}

/** The previous mark (rounded square with a dot), kept for comparison in the gallery. */
export function LegacyMark({ className, monochrome }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2.25" />
      <circle cx="12" cy="12" r="3.5" className={accent(monochrome)} />
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
