import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select data-slot="select" className={cn("sb-select-block", className)} {...props}>
      {children}
    </select>
  )
}

function SelectOption(props: React.ComponentProps<"option">) {
  return <option {...props} />
}

export { Select, SelectOption }
