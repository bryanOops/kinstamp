import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold tracking-[-0.004em] whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-(--duration-fast) ease-(--ease-standard) outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-ink-hover",
        secondary: "border-ink bg-canvas text-ink hover:bg-canvas-deep",
        outline: "border-line-strong bg-surface text-ink hover:bg-canvas aria-expanded:bg-canvas",
        ghost: "text-ink hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-destructive bg-surface text-destructive hover:bg-destructive hover:text-white focus-visible:ring-destructive",
        link: "h-auto rounded-none p-0 font-medium text-ink underline underline-offset-4 hover:text-stamp-ink",
        inverse: "bg-white text-ink hover:bg-canvas",
      },
      // Compact sizes grow to a 44px hit area on touch widths and shrink from `sm`.
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3.5 text-sm sm:h-9 sm:px-3",
        xs: "h-9 gap-1.5 rounded-md px-2.5 text-xs sm:h-8 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 rounded-xl px-6 text-md",
        icon: "size-11",
        "icon-sm": "size-11 sm:size-9",
        "icon-xs": "size-9 rounded-md sm:size-8 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
