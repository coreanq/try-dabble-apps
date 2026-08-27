import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Brass keys off a shop till: square-cut, hairline-ruled, forest ink when they
 * commit and a gold seat under them that flattens on press. The shadcn API is
 * untouched — only the dress changes.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/35 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-forest-deep bg-forest text-primary-foreground shadow-[0_2px_0_var(--color-gold-deep)] hover:bg-forest-deep active:shadow-none",
        secondary:
          "border-edge bg-leaf-2 text-ink shadow-[0_2px_0_var(--color-edge)] hover:bg-gold-soft active:shadow-none",
        outline:
          "border-edge bg-leaf text-muted-ink hover:border-gold hover:text-ink active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:bg-gold-soft hover:text-forest-deep active:shadow-none",
        destructive:
          "border-destructive bg-red-ink-bg text-red-ink hover:bg-[#f0cec7] active:shadow-none",
        link: "border-transparent text-forest underline-offset-4 hover:underline active:translate-none",
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
