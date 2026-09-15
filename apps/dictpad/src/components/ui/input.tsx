import * as React from "react"

import { cn } from "@/lib/utils"

/** Text / number field dressed as a ledger form field (see .dp-input). 16px, no zoom. */
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("dp-input", className)} {...props} />
}

export { Input }
