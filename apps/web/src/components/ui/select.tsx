import { useId, type ComponentProps, type ReactNode } from "react"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

/**
 * Labelled native select styled like Field (44px, same border and focus ring).
 * Native keeps the right picker on phones and full keyboard support.
 * `prefix` shows a short caption inside the control (for toolbars);
 * `hideLabel` keeps the label for screen readers only.
 */
export function Select({
  label,
  hideLabel = false,
  hint,
  error,
  prefix,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hideLabel?: boolean; hint?: ReactNode; error?: string | null; prefix?: string }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "type-caption text-ink"}>
        {label}
      </label>
      <div
        className={cn(
          "relative flex h-11 items-center rounded-[var(--radius-chip)] border bg-surface-sunken transition-colors",
          hideLabel ? "" : "mt-2",
          "focus-within:border-safelight-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-safelight-text",
          error ? "border-danger" : "border-line-strong hover:border-ink-muted"
        )}
      >
        {prefix && <span className="pl-3 type-caption font-normal whitespace-nowrap text-ink-muted">{prefix}</span>}
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-9 pl-3 text-body text-ink outline-none [&>option]:bg-surface-raised"
          {...props}
        >
          {children}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 size-4 text-ink-muted" />
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
