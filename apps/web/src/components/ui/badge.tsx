import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type Tone = "neutral" | "accent" | "success" | "warning" | "info" | "danger"

/*
 * Status pill (Draft, Published, Delivered...). The label is always a word:
 * colour alone never carries the state. `soft` is a tint for use on surfaces;
 * `solid` is for sitting on top of photos. For small mono labels on
 * a card or photo use Chip (ui/card) instead.
 */
const soft: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  accent: "bg-safelight-soft text-safelight-text",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  danger: "bg-danger/15 text-danger",
}
const solid: Record<Tone, string> = {
  neutral: "bg-surface-raised/90 text-ink",
  accent: "bg-safelight text-on-safelight",
  success: "bg-success text-surface",
  warning: "bg-warning text-surface",
  info: "bg-info text-surface",
  danger: "bg-danger text-surface",
}

export function Badge({ tone = "neutral", variant = "soft", className, ...props }: ComponentProps<"span"> & { tone?: Tone; variant?: "soft" | "solid" }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 type-caption whitespace-nowrap", (variant === "solid" ? solid : soft)[tone], className)}
      {...props}
    />
  )
}
