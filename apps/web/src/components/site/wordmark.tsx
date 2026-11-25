import { cn } from "@/lib/utils"

/**
 * Placeholder wordmark until the brand book's logo files arrive.
 * The mark is a safelight lamp: a lit dot inside a frame corner.
 */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
        <path d="M3 9V3h6M21 15v6h-6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" fill="var(--safelight)" />
      </svg>
      {!compact && (
        <span className="font-heading text-xl leading-none font-bold tracking-[-0.03em]">
          Framesly
        </span>
      )}
    </span>
  )
}
