import { useId, type ComponentProps, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Labelled text input: 44px tall, 6px radius, --line-strong border.
 * Errors always carry words, not only colour.
 */
export function Field({
  label,
  hideLabel = false,
  hint,
  error,
  prefix,
  suffix,
  className,
  ...props
}: ComponentProps<"input"> & {
  label: string
  /** Keep the label for screen readers only (the placeholder or layout shows the purpose). */
  hideLabel?: boolean
  hint?: ReactNode
  error?: string | null
  prefix?: string
  /** Trailing control inside the field, e.g. a show-password button. */
  suffix?: ReactNode
}) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "type-caption text-ink"}>
        {label}
      </label>
      <div
        className={cn(
          hideLabel ? "" : "mt-2",
          "flex h-11 items-center rounded-[var(--radius-chip)] border bg-surface-sunken transition-colors",
          "focus-within:border-safelight-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-safelight-text",
          error ? "border-danger" : "border-line-strong hover:border-ink-muted"
        )}
      >
        {prefix && <span className="pl-3 type-metric text-caption whitespace-nowrap text-ink-muted">{prefix}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-full w-full min-w-0 bg-transparent px-3 text-body text-ink outline-none placeholder:text-ink-muted/70",
            prefix && "pl-0.5"
          )}
          {...props}
        />
        {suffix}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 type-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 type-caption font-normal text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
