import { cn } from "@/lib/utils"

/** A progress bar. `value` is 0 to 100. `label` names what is progressing, for screen readers. */
export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className={cn("h-1.5 overflow-hidden rounded-full bg-surface-sunken", className)}>
      <div className="h-full bg-safelight transition-[width] duration-(--duration-base)" style={{ width: `${v}%` }} />
    </div>
  )
}
