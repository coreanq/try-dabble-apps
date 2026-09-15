import * as React from "react"

import { cn } from "@/lib/utils"

/** Text / number field dressed as a paper form field (see .lnp-input). 16px, no zoom. */
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("lnp-input", className)} {...props} />
}

export { Input }
