import * as React from "react"

import { cn } from "@/lib/utils"

/** Text / number field dressed as a gym form field (see .gm-input). 16px, no zoom. */
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("gm-input", className)} {...props} />
}

export { Input }
