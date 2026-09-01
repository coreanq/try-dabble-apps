import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Console keycaps: hard bottom lip, tight caps, gel-coloured faces. The shadcn
 * API is untouched — only the dress. The giant GO key is not this component;
 * it is .pc-go, because nothing else on the deck is that size.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[7px] border font-bold tracking-[0.03em] whitespace-nowrap transition-transform duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[#a6ffd0] bg-go text-[#04240f] shadow-[0_3px_0_var(--color-go-deep)] hover:brightness-110",
        secondary:
          "border-rail bg-panel-2 text-stage-ink shadow-[0_3px_0_#120b1f] hover:bg-[#33224f]",
        outline:
          "border-rail bg-transparent text-stage-muted shadow-[0_2px_0_#120b1f] hover:text-stage-ink",
        ghost: "border-transparent text-stage-muted hover:bg-panel-2 hover:text-stage-ink",
        destructive:
          "border-[#5c2338] bg-[#33121e] text-[#ff8e9c] shadow-[0_3px_0_#220c14] hover:bg-[#43172a]",
        link: "border-transparent text-amber underline-offset-4 shadow-none hover:underline active:translate-y-0",
      },
      size: {
        default: "h-11 px-4 text-[0.86rem]",
        xs: "h-7 px-2 text-[0.7rem]",
        sm: "h-9 px-3 text-[0.78rem]",
        lg: "h-12 px-5 text-[0.95rem]",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
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
