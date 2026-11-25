import { useId, type ComponentProps, type ReactNode } from "react"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

/** Checkbox with its label. The whole row is the tap target (44px tall). */
export function Checkbox({ label, hint, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 type-caption text-ink">
        <span className="relative grid size-5 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            aria-describedby={hint ? `${id}-hint` : undefined}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-[var(--radius-chip)] border border-line-strong bg-surface-sunken transition-colors",
              "checked:border-safelight checked:bg-safelight hover:border-ink-muted disabled:cursor-not-allowed disabled:opacity-45"
            )}
            {...props}
          />
          <Icon name="check" strokeWidth={3} className="pointer-events-none absolute size-3.5 text-on-safelight opacity-0 peer-checked:opacity-100" />
        </span>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 pl-8 type-caption font-normal text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
