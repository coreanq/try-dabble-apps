import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Lab keys: square-cut, hairline-bordered, indigo when they act. They press
 * one pixel into the bench instead of bouncing — nothing like the offset-shadow
 * tags a sibling app uses. The shadcn API is unchanged, only the dress.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/35 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-indigo-deep bg-indigo text-primary-foreground shadow-[0_1px_0_var(--color-indigo-deep)] hover:bg-indigo-deep active:shadow-none",
        secondary:
          "border-edge bg-paper-2 text-ink hover:bg-indigo-soft active:shadow-none",
        outline:
          "border-edge bg-paper text-muted-ink hover:border-indigo hover:text-ink active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:bg-indigo-soft hover:text-indigo-deep active:shadow-none",
        destructive:
          "border-destructive bg-flag-bg text-flag hover:bg-[#f7cdd0] active:shadow-none",
        link: "border-transparent text-indigo-deep underline-offset-4 hover:underline active:translate-none",
      },
      size: {
        default: "h-10 px-4 text-[0.84rem]",
        xs: "h-6 px-2 text-[0.68rem]",
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
