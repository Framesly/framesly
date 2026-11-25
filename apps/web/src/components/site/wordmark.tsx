import { BRAND_MARK_PATH, BRAND_MARK_VIEWBOX } from "@/lib/brand-mark"
import { cn } from "@/lib/utils"

/** The Framesly aperture on its own, in the theme's safelight colour. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox={BRAND_MARK_VIEWBOX} className={cn("size-10 shrink-0", className)} aria-hidden>
      <path d={BRAND_MARK_PATH} fill="var(--safelight)" />
    </svg>
  )
}

/** The Framesly logo: the aperture mark with the uppercase name, as in logo/Primary.png. */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-ink", className)}>
      <BrandMark />
      {compact ? (
        <span className="sr-only">Framesly</span>
      ) : (
        <span className="font-heading text-2xl leading-none font-medium tracking-[0.06em] uppercase">Framesly</span>
      )}
    </span>
  )
}
