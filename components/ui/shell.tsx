import type * as React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div className={cn("w-full space-y-6 p-8 pt-16 max-w-[1600px] mx-auto", className)} {...props}>
      {children}
    </div>
  )
}
