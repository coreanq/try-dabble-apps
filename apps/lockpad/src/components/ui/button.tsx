import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Pills for the manuscript: indigo primary (work), amber for breaks, teal for
 * the bank, card-white secondary. The shadcn API is untouched — only the
 * dress. Row buttons in wrapping flex rows use .lp-btn instead.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap transition-transform duration-75 outline-none select-none touch-manipulation focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-indigo-deep/50 bg-indigo text-primary-foreground shadow-[0_2px_0_var(--color-indigo-deep)] hover:brightness-105",
        amber:
          "border-amber-deep/50 bg-amber text-primary-foreground shadow-[0_2px_0_var(--color-amber-deep)] hover:brightness-105",
        teal: "border-teal-deep/50 bg-teal text-primary-foreground shadow-[0_2px_0_var(--color-teal-deep)] hover:brightness-105",
        secondary:
          "border-line-2 bg-card text-foreground shadow-[0_2px_0_rgba(30,41,59,0.08)] hover:bg-muted",
        outline:
          "border-line-2 bg-transparent text-muted-foreground shadow-none hover:text-foreground",
        ghost: "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "border-red-300 bg-red-100 text-red-800 shadow-[0_2px_0_rgba(185,28,28,0.2)] hover:brightness-95",
        link: "border-transparent text-indigo underline-offset-4 shadow-none hover:underline active:translate-y-0",
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
