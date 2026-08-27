import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Office-supply buttons: near-square corners, hard offset shadow, tight caps —
 * a teal date stamp and manila filing tabs. The shadcn API is unchanged, only
 * the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] border-[1.5px] font-bold tracking-[0.02em] whitespace-nowrap transition-transform duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-teal-deep bg-teal text-card-paper shadow-[2px_2px_0_var(--color-teal-deep)] hover:bg-teal-deep active:shadow-[1px_1px_0_var(--color-teal-deep)]",
        secondary:
          "border-ink bg-manila text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-manila-2 active:shadow-[1px_1px_0_var(--color-ink)]",
        outline:
          "border-manila-edge bg-card-paper text-muted-ink shadow-[1px_1px_0_var(--color-manila-edge)] hover:bg-manila-2 hover:text-ink active:shadow-none",
        ghost:
          "border-manila-edge bg-card-paper text-muted-ink shadow-[1px_1px_0_var(--color-manila-edge)] hover:bg-manila-2 hover:text-ink active:shadow-none",
        destructive:
          "border-oxblood bg-oxblood-bg text-oxblood shadow-[1px_1px_0_var(--color-oxblood)] hover:bg-[#f2cec8] active:shadow-none",
        link: "border-transparent text-teal-deep underline-offset-4 shadow-none hover:underline active:translate-none",
      },
      size: {
        default: "h-10 px-3.5 text-[0.82rem]",
        xs: "h-6 px-2 text-[0.68rem]",
        sm: "h-8 px-2.5 text-[0.74rem]",
        lg: "h-11 px-4 text-[0.88rem]",
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
