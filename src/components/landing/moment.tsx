import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type MomentProps = {
  id: string;
  title: string;
  body: string;
  /** The product doing the one thing the text claims, built from the app's primitives. */
  children: ReactNode;
  /**
   * `wide`: text on the left (4 columns), fragment on the right (8).
   * `flipped`: fragment on the left (6), text on the right (5), with a gap column.
   * `stacked`: text above in a narrow measure, fragment full width below.
   */
  layout: "wide" | "flipped" | "stacked";
  tone?: "canvas" | "surface";
  className?: string;
};

/**
 * One editorial spread: a claim set large, one plain sentence, and a real UI fragment as proof.
 * The fragment is decorative for assistive tech; the text carries the meaning.
 */
export function Moment({ id, title, body, children, layout, tone = "canvas", className }: MomentProps) {
  const headingId = `${id}-title`;

  return (
    <section aria-labelledby={headingId} className={cn("border-t border-line", tone === "surface" && "bg-surface", className)}>
      <Container
        className={cn(
          "grid gap-10 py-16 sm:py-20 lg:gap-x-12 lg:py-28",
          layout === "wide" && "lg:grid-cols-12 lg:items-start",
          layout === "flipped" && "lg:grid-cols-12 lg:items-center",
          layout === "stacked" && "lg:gap-y-14",
        )}
      >
        <div
          className={cn(
            layout === "wide" && "lg:col-span-4",
            layout === "flipped" && "lg:order-2 lg:col-span-5 lg:col-start-8",
            layout === "stacked" && "max-w-[44rem]",
          )}
        >
          <h2
            id={headingId}
            className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.024em] text-ink sm:text-[2.5rem] lg:text-[2.75rem]"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-muted">{body}</p>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "min-w-0",
            layout === "wide" && "lg:col-span-8",
            layout === "flipped" && "lg:order-1 lg:col-span-6",
          )}
        >
          {children}
        </div>
      </Container>
    </section>
  );
}
