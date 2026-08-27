import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Ribbon buttons: a soft-cornered tag with a hard offset shadow that presses in
 * when you push it. Sentence case, not the tracked-out caps a sibling app uses.
 * The shadcn API is unchanged, only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[5px] border-[1.5px] font-bold whitespace-nowrap transition-transform duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ribbon-deep bg-ribbon text-tag shadow-[0_2px_0_var(--color-ribbon-deep)] hover:bg-ribbon-deep active:shadow-[0_1px_0_var(--color-ribbon-deep)]",
        secondary:
          "border-tag-edge bg-tag-2 text-ink shadow-[0_2px_0_var(--color-tag-edge)] hover:bg-[#f7e2c8] active:shadow-[0_1px_0_var(--color-tag-edge)]",
        outline:
          "border-tag-edge bg-tag text-muted-ink shadow-[0_1px_0_var(--color-tag-edge)] hover:bg-tag-2 hover:text-ink active:shadow-none",
        ghost:
          "border-dashed border-tag-edge bg-tag text-muted-ink hover:bg-tag-2 hover:text-ink active:shadow-none",
        destructive:
          "border-ribbon-deep bg-ribbon-bg text-ribbon-deep shadow-[0_1px_0_var(--color-ribbon-deep)] hover:bg-[#f6c3b9] active:shadow-none",
        link: "border-transparent text-ribbon-deep underline-offset-4 shadow-none hover:underline active:translate-none",
      },
      size: {
        default: "h-10 px-4 text-[0.84rem]",
        xs: "h-6 px-2.5 text-[0.68rem]",
        sm: "h-8 px-3 text-[0.74rem]",
        lg: "h-11 px-5 text-[0.9rem]",
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
