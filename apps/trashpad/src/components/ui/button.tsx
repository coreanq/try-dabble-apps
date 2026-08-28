import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Carbon-copy form buttons: a squared 1.5px rule with a hairline highlight
 * printed just inside it, and a press that sinks the paper. The shadcn API is
 * untouched — only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border-[1.5px] font-bold tracking-[0.02em] whitespace-nowrap transition-[transform,box-shadow] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-graphite bg-graphite text-pad shadow-[inset_0_0_0_1px_rgba(253,245,208,0.3)] hover:bg-ink active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
        secondary:
          "border-border bg-desk-2 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] hover:bg-pad-2 active:shadow-[inset_0_1px_2px_rgba(32,29,23,0.18)]",
        outline:
          "border-border bg-pad text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] hover:bg-pad-2 active:shadow-[inset_0_1px_2px_rgba(32,29,23,0.18)]",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:border-border hover:bg-desk-2 hover:text-ink",
        destructive:
          "border-gone bg-gone-bg text-gone shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] hover:bg-[#f1cbc2] active:shadow-[inset_0_1px_2px_rgba(178,58,46,0.25)]",
        link: "border-transparent text-gone underline-offset-4 hover:underline active:translate-none",
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
