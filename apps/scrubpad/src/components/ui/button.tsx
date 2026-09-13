import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Pills for the timer sheet: coral primary, card-white secondary, teal for the
 * strength side, a muted coral for destructive. The shadcn API is untouched —
 * only the dress. Form buttons on the cards are .gm-btn because they sit in
 * two-column grids.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap transition-transform duration-75 outline-none select-none touch-manipulation focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-cobalt-deep/50 bg-cobalt text-primary-foreground shadow-[0_2px_0_var(--color-cobalt-deep)] hover:brightness-105",
        secondary:
          "border-line-2 bg-card text-foreground shadow-[0_2px_0_rgba(42,31,26,0.08)] hover:bg-muted",
        teal: "border-rest-deep/50 bg-rest text-primary-foreground shadow-[0_2px_0_var(--color-rest-deep)] hover:brightness-105",
        outline:
          "border-line-2 bg-transparent text-muted-foreground shadow-none hover:text-foreground",
        ghost: "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "border-cobalt/40 bg-cobalt-soft text-cobalt-ink shadow-[0_2px_0_rgba(232,93,76,0.25)] hover:brightness-95",
        link: "border-transparent text-cobalt-deep underline-offset-4 shadow-none hover:underline active:translate-y-0",
      },
      size: {
        default: "h-11 px-4 text-[1rem]",
        xs: "h-9 px-3 text-[1rem]",
        sm: "h-10 px-3 text-[1rem]",
        lg: "h-12 px-5 text-[1rem]",
        icon: "size-11",
        "icon-xs": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12",
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
