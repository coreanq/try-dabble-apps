import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/** shadcn switch; rose when on, line-grey when off. Same API, new dress. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 touch-manipulation items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-4 focus-visible:ring-rose/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-rose data-[state=unchecked]:bg-line-2",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 rounded-full bg-cream shadow-[0_1px_3px_rgba(90,40,50,0.35)] ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
