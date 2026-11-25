import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** A pulsing placeholder block. Size and shape come from `className`. Hidden from screen readers; the page region says it is loading. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-[var(--radius-chip)] bg-surface-raised", className)} {...props} />
}
