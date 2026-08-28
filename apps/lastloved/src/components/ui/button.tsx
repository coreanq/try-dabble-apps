import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Stamped buttons: a squared 1.5px rule with the ink pressed into the card
 * stock, and a press that sinks the ticket. The shadcn API is untouched —
 * only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border-[1.5px] font-bold tracking-[0.02em] whitespace-nowrap transition-[transform,box-shadow] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-violet bg-violet text-stub shadow-[inset_0_0_0_1px_rgba(253,248,242,0.26)] hover:bg-[#4a3670] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
        secondary:
          "border-rule bg-stub-2 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] hover:bg-stub active:shadow-[inset_0_1px_2px_rgba(46,39,51,0.18)]",
        outline:
          "border-ink bg-stub text-ink shadow-[1px_1px_0_var(--color-ink)] hover:bg-stub-2 active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:border-rule hover:bg-stub-2 hover:text-ink",
        destructive:
          "border-due bg-due-bg text-due shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] hover:bg-[#f2cdd8] active:shadow-[inset_0_1px_2px_rgba(168,52,84,0.25)]",
        link: "border-transparent text-violet underline-offset-4 hover:underline active:translate-none",
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
