import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Plastic keys off a film camera: a yellow face for the one thing to do, a
 * black-plastic face for the rest, red for the roll-wide destructive actions.
 * The shadcn API is untouched — only the dress. The shutter is not this
 * component; it is .sr-shutter, because nothing else on the body is that size.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[8px] border font-bold tracking-[0.02em] whitespace-nowrap transition-transform duration-75 outline-none select-none touch-manipulation focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[#8a5f12] bg-[linear-gradient(180deg,#ffd76a_0%,#f2b632_55%,#d99a1c_100%)] text-[#2a2118] shadow-[0_3px_0_#8a5f12] hover:brightness-105",
        secondary:
          "border-[#1c160f] bg-[linear-gradient(180deg,#4a3b2a_0%,#2a2118_100%)] text-[#f5e9cf] shadow-[0_3px_0_#120e09] hover:brightness-110",
        outline:
          "border-[var(--sr-line)] bg-transparent text-[var(--sr-fg)] shadow-[0_2px_0_rgba(0,0,0,0.25)] hover:bg-[var(--sr-panel-2)]",
        ghost: "border-transparent text-[var(--sr-fg-muted)] hover:bg-[var(--sr-panel-2)] hover:text-[var(--sr-fg)]",
        destructive:
          "border-[#5a1d12] bg-[linear-gradient(180deg,#5a2419_0%,#33120b_100%)] text-[#ffb3a6] shadow-[0_3px_0_#1f0904] hover:brightness-110",
        link: "border-transparent text-[var(--sr-accent)] underline-offset-4 shadow-none hover:underline active:translate-y-0",
      },
      size: {
        default: "h-11 px-4 text-[1rem]",
        xs: "h-9 px-2 text-[1rem]",
        sm: "h-10 px-3 text-[1rem]",
        lg: "h-12 px-5 text-[1.05rem]",
        icon: "size-11",
        "icon-xs": "size-9 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 [&_svg:not([class*='size-'])]:size-3.5",
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
