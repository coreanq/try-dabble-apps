import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Letterpress buttons: a squared 1.5px rule with the ink printed hard into the
 * paper, and a press that sinks the sheet. The shadcn API is untouched — only
 * the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border-[1.5px] font-bold tracking-[0.02em] whitespace-nowrap transition-[transform,box-shadow] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-stamp bg-stamp text-paper shadow-[inset_0_0_0_1px_rgba(246,236,216,0.28)] hover:bg-[#265a52] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
        secondary:
          "border-line bg-paper-2 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] hover:bg-vellum active:shadow-[inset_0_1px_2px_rgba(51,41,29,0.18)]",
        outline:
          "border-ink bg-vellum text-ink shadow-[1px_1px_0_var(--color-ink)] hover:bg-paper-2 active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:border-line hover:bg-paper-2 hover:text-ink",
        destructive:
          "border-route bg-route-bg text-route shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] hover:bg-[#eccdc2] active:shadow-[inset_0_1px_2px_rgba(180,71,46,0.25)]",
        link: "border-transparent text-route underline-offset-4 hover:underline active:translate-none",
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
