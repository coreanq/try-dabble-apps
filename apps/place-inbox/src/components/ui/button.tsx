import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Luggage-tag buttons: full-pill, hard offset shadow, tracked-out caps — a
 * boarding-pass stub rather than an office key. The shadcn API is unchanged,
 * only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-[1.5px] font-bold tracking-[0.03em] whitespace-nowrap transition-transform duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-marine-deep bg-marine text-sand shadow-[2px_2px_0_var(--color-marine-deep)] hover:bg-marine-deep active:shadow-[1px_1px_0_var(--color-marine-deep)]",
        secondary:
          "border-foam-deep bg-foam-bg text-foam-deep shadow-[2px_2px_0_var(--color-foam-deep)] hover:bg-[#c6e8db] active:shadow-[1px_1px_0_var(--color-foam-deep)]",
        outline:
          "border-sand-edge bg-[#fffdf7] text-muted-ink shadow-[1px_1px_0_var(--color-sand-edge)] hover:bg-sand-2 hover:text-ink active:shadow-none",
        ghost:
          "border-dashed border-sand-edge bg-[#fffdf7] text-muted-ink hover:bg-sand-2 hover:text-ink active:shadow-none",
        destructive:
          "border-postmark bg-postmark-bg text-postmark shadow-[1px_1px_0_var(--color-postmark)] hover:bg-[#f2cbc3] active:shadow-none",
        link: "border-transparent text-marine underline-offset-4 shadow-none hover:underline active:translate-none",
      },
      size: {
        default: "h-10 px-4 text-[0.82rem]",
        xs: "h-6 px-2.5 text-[0.66rem]",
        sm: "h-8 px-3 text-[0.72rem]",
        lg: "h-11 px-5 text-[0.88rem]",
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
