import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Wooden keys off the board's edge: hard-edged, seated on a shadow that
 * flattens on press, the way a ceramic tile seats into the walnut board.
 * The shadcn API is untouched — only the dress changes.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[0.28rem] border font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-walnut-dark bg-walnut text-primary-foreground shadow-[0_2px_0_var(--color-walnut-dark)] hover:bg-walnut-dark active:shadow-none",
        secondary:
          "border-border bg-secondary text-ink shadow-[0_2px_0_var(--color-border)] hover:bg-accent active:shadow-none",
        outline:
          "border-border bg-background text-muted-foreground hover:border-walnut hover:text-ink active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-ink active:shadow-none",
        destructive:
          "border-vermilion bg-vermilion/15 text-vermilion hover:bg-vermilion/25 active:shadow-none",
        link: "border-transparent text-walnut underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-[0.84rem]",
        xs: "h-6 px-2 text-[0.68rem]",
        sm: "h-8 px-3 text-[0.76rem]",
        lg: "h-11 px-5 text-[0.9rem]",
        icon: "size-10",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
