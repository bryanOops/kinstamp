import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-md text-ink transition-[border-color,box-shadow] duration-(--duration-fast) outline-none placeholder:text-ink-subtle hover:border-ink-disabled focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/25 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
