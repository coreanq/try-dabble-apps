import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Kitchen-label buttons: hard offset shadow, near-square corners, tight caps.
 * The shadcn API is unchanged — only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] border-[1.5px] font-extrabold tracking-[0.04em] whitespace-nowrap transition-transform duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-chili-deep bg-chili text-paper-2 shadow-[2px_2px_0_var(--color-chili-deep)] hover:bg-chili-deep active:shadow-[1px_1px_0_var(--color-chili-deep)]",
        secondary:
          "border-ink bg-kraft-2 text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-kraft active:shadow-[1px_1px_0_var(--color-ink)]",
        outline:
          "border-kraft bg-paper-2 text-muted-ink shadow-[1px_1px_0_var(--color-kraft)] hover:bg-kraft-2 hover:text-ink active:shadow-none",
        ghost:
          "border-kraft bg-paper-2 text-muted-ink shadow-[1px_1px_0_var(--color-kraft)] hover:bg-kraft-2 hover:text-ink active:shadow-none",
        destructive:
          "border-tomato bg-tomato-bg text-tomato shadow-[1px_1px_0_var(--color-tomato)] hover:bg-[#f3cec4] active:shadow-none",
        link: "border-transparent text-chili underline-offset-4 shadow-none hover:underline active:translate-none",
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
