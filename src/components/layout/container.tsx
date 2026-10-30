import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  /** `wide` is 1120px (app screens); `narrow` is 640px (reading and forms). */
  size?: "wide" | "narrow";
  className?: string;
};

export function Container({ children, size = "wide", className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full gutter-x", size === "wide" ? "max-w-[1120px]" : "max-w-[640px]", className)}>
      {children}
    </div>
  );
}
