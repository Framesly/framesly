import type { ComponentProps } from "react"

import { Viewfinder } from "@/components/ui/viewfinder"
import { cn } from "@/lib/utils"

/**
 * Flat card with a --line border and no shadow. On hover or
 * keyboard focus inside it, viewfinder brackets frame the card.
 */
export function Card({
  className,
  children,
  focusFrame = true,
  ...props
}: ComponentProps<"div"> & { focusFrame?: boolean }) {
  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-control)] border border-line bg-surface-raised",
        "transition-colors duration-300 hover:border-line-strong",
        className
      )}
      {...props}
    >
      {focusFrame && <Viewfinder state="hover" inset={-7} size={12} />}
      {children}
    </div>
  )
}

/** Mono "edge print" caption, like the text on a film's rebate. */
export function EdgeLabel({
  className,
  children,
  tone = "muted",
  ...props
}: ComponentProps<"p"> & { tone?: "muted" | "safelight" | "ink" }) {
  return (
    <p
      className={cn(
        "type-label",
        tone === "muted" && "text-ink-muted",
        tone === "safelight" && "text-safelight-text",
        tone === "ink" && "text-ink",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

/** Small status chip. Done and error states always carry a word, not only colour. */
export function Chip({
  className,
  tone = "neutral",
  children,
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "pick" | "reject" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[var(--radius-chip)] px-2 type-label whitespace-nowrap",
        tone === "neutral" && "bg-surface-sunken text-ink-muted",
        tone === "pick" && "bg-safelight-soft text-safelight-text",
        tone === "reject" && "bg-[rgb(var(--scrim)/0.72)] text-[#e9ecf1]",
        tone === "success" && "bg-surface-sunken text-success",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
