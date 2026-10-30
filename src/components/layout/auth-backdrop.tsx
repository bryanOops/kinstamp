import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthBackdropProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Backdrop for the auth screens: a faint ink grid, a dotted "case path" with four
 * stages, and a small vermilion mark that travels the path. Pure SVG + CSS, no
 * library. Under `prefers-reduced-motion` the global rule freezes every animation on
 * its last frame, which leaves the mark resting on the final stage.
 */
export function AuthBackdrop({ children, className }: AuthBackdropProps) {
  return (
    <div className={cn("relative isolate flex flex-1 flex-col overflow-hidden", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
        {/* Grid: 1px ink lines at 4% opacity, every 48px, fading toward the edges. */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgb(11_11_15/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(11_11_15/0.045)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_30%,transparent_100%)]"
        />
        {/* The case path. Stage dots in ink; the current stage ring and the traveller in vermilion. */}
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full text-ink"
        >
          <path
            id="auth-case-path"
            d="M-40 560 C 180 560, 220 240, 440 240 S 700 560, 920 560 S 1120 240, 1260 240"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
            className="opacity-[0.18]"
          />
          {[
            [200, 420],
            [440, 240],
            [680, 400],
            [920, 560],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`} className="opacity-[0.22]">
              <circle r="5" fill="currentColor" />
              {i === 3 && <circle r="14" fill="none" stroke="var(--color-stamp)" strokeWidth="1.5" className="auth-backdrop-ring" />}
            </g>
          ))}
          {/* Traveller: a small stamp ring that moves along the path over 24s. */}
          <g className="auth-backdrop-traveller">
            <circle r="9" fill="var(--color-canvas)" stroke="var(--color-stamp)" strokeWidth="2" />
            <circle r="3" fill="var(--color-stamp)" />
          </g>
        </svg>
      </div>
      {children}
    </div>
  );
}
