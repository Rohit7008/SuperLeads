import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-zinc-500 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black h-11 w-full min-w-0 rounded-none border-2 border-black dark:border-white bg-transparent px-3 py-1 text-base transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:text-sm font-bold",
        className
      )}
      {...props}
    />
  )
}

export { Input }
