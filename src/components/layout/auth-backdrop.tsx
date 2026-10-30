import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthBackdropProps = {
  children: ReactNode;
  className?: string;
};

type Point = readonly [number, number];
type Curve = { c1: Point; c2: Point; to: Point };

/**
 * The case path in viewBox units (1200 x 800): a start knot and three cubic curves.
 * Control points are spelled out so the stage markers can be derived from the same
 * geometry as the path instead of being typed by hand (a hand-typed marker once sat
 * 20 units under the curve). `globals.css` carries the same curve, in `S` shorthand,
 * for the traveller's `offset-path`; keep both in sync when changing the shape.
 */
const pathStart: Point = [-40, 560];
const pathCurves: readonly Curve[] = [
  { c1: [180, 560], c2: [220, 240], to: [440, 240] },
  { c1: [660, 240], c2: [700, 560], to: [920, 560] },
  { c1: [1140, 560], c2: [1120, 240], to: [1260, 240] },
];

const pathD = pathCurves.reduce(
  (d, { c1, c2, to }) => `${d} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${to[0]} ${to[1]}`,
  `M${pathStart[0]} ${pathStart[1]}`,
);

function pointOnCurve(from: Point, { c1, c2, to }: Curve, t: number): Point {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [
    w[0] * from[0] + w[1] * c1[0] + w[2] * c2[0] + w[3] * to[0],
    w[0] * from[1] + w[1] * c1[1] + w[2] * c2[1] + w[3] * to[1],
  ];
}

/** Four stages: the midpoint of the first rise, its knot, the midpoint of the fall, and its knot. */
const stages: readonly Point[] = [
  pointOnCurve(pathStart, pathCurves[0], 0.5),
  pathCurves[0].to,
  pointOnCurve(pathCurves[0].to, pathCurves[1], 0.5),
  pathCurves[1].to,
];

/**
 * Backdrop for the auth screens: a faint ink grid, a dotted "case path" with four
 * stages, and a small vermilion mark that travels the path. Pure SVG + CSS, no
 * library. Path, stage dots, ring and traveller all live in the same SVG and share
 * its viewBox, so they scale together at every viewport. Under
 * `prefers-reduced-motion` the global rule freezes every animation on its last
 * frame, which leaves the mark resting on the final stage.
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
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
            className="opacity-[0.18]"
          />
          {stages.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`} className="opacity-[0.22]">
              <circle r="5" fill="currentColor" />
              {i === stages.length - 1 && (
                <circle r="14" fill="none" stroke="var(--color-stamp)" strokeWidth="1.5" className="auth-backdrop-ring" />
              )}
            </g>
          ))}
          {/* Traveller: a small stamp ring that moves along the path over 24s (CSS `offset-path`, same curve). */}
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
