import * as React from "react"

import { cn } from "@/lib/utils"

/** Text / number field dressed as a scrubber form field (see .sp-input). 16px, no zoom. */
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("sp-input", className)} {...props} />
}

export { Input }
