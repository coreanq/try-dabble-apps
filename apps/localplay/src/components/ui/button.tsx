import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Soft pills for the record room: indigo primary, cream secondary, a muted red for
 * remove. The shadcn API is untouched — only the dress. Track rows and the
 * transport keys are not this component; they are .lp-row-main and .lp-key.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap transition-transform duration-75 outline-none select-none touch-manipulation focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-indigo-deep/40 bg-indigo text-primary-foreground shadow-[0_2px_0_var(--color-indigo-deep)] hover:brightness-105",
        secondary:
          "border-line-2 bg-paper text-ink shadow-[0_2px_0_rgba(34,33,74,0.08)] hover:bg-cream-2",
        outline:
          "border-line-2 bg-transparent text-ink-muted shadow-none hover:text-ink",
        ghost: "border-transparent text-ink-muted hover:bg-cream-2 hover:text-ink",
        destructive:
          "border-danger/40 bg-danger-soft text-danger shadow-[0_2px_0_rgba(184,67,58,0.25)] hover:brightness-95",
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
