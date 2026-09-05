import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Shop-sign buttons: a squared 1.5px rule with a hard drop shadow, like a
 * price card standing on the counter, and a press that sets it down flat.
 * The shadcn API is untouched — only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border-[1.5px] font-bold tracking-[0.02em] whitespace-nowrap transition-[transform,box-shadow] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-awning text-label shadow-[1.5px_2px_0_var(--color-ink)] hover:bg-[#174c34] active:shadow-[0_0_0_var(--color-ink)]",
        secondary:
          "border-ink bg-label-2 text-ink shadow-[1.5px_2px_0_rgba(35,41,31,0.35)] hover:bg-label active:shadow-none",
        outline:
          "border-ink bg-label text-ink shadow-[1.5px_2px_0_rgba(35,41,31,0.28)] hover:bg-label-2 active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:border-rule hover:bg-label-2 hover:text-ink",
        destructive:
          "border-price bg-price-bg text-price shadow-[1.5px_2px_0_rgba(191,59,44,0.3)] hover:bg-[#f6d2c9] active:shadow-none",
        link: "border-transparent text-awning underline-offset-4 hover:underline active:translate-none",
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
