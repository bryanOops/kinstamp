import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3.5 py-2 text-md text-ink transition-[border-color,box-shadow] duration-(--duration-fast) outline-none placeholder:text-ink-subtle hover:border-ink-disabled focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/25 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
