import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Native <select> dressed as a PetPlay form field (see .pp-select-block). The
 * native picker is the right control on a phone: one tap, big rows, no portal.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select data-slot="select" className={cn("pp-select-block", className)} {...props}>
      {children}
    </select>
  )
}

function SelectOption(props: React.ComponentProps<"option">) {
  return <option {...props} />
}

export { Select, SelectOption }
