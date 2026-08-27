import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Keys off the packing table: square-cut, hard-edged, a strip of amber tape
 * seated under the primary one that flattens on press. The shadcn API is
 * untouched — only the dress changes.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[2px] border font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-75 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-kraft-dark text-primary-foreground shadow-[0_2px_0_var(--color-tape)] hover:bg-ink active:shadow-none",
        secondary:
          "border-edge bg-label-2 text-ink shadow-[0_2px_0_var(--color-edge)] hover:bg-accent active:shadow-none",
        outline:
          "border-edge bg-label text-muted-ink hover:border-kraft-dark hover:text-ink active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-muted-ink hover:bg-accent hover:text-kraft-dark active:shadow-none",
        destructive:
          "border-stamp bg-stamp-soft text-stamp hover:bg-[#eec5bf] active:shadow-none",
        link: "border-transparent text-kraft-dark underline-offset-4 hover:underline active:translate-none",
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
