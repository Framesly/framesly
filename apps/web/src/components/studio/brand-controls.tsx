"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"

import { checkSlugAction, type SlugCheck } from "@/features/studio/actions"
import { validateLogo } from "@/features/studio/upload-logo"
import { useSitePhotos } from "@/components/site/site-photos"
import { StudioLogo } from "@/components/studio/studio-logo"
import { Icon } from "@/components/ui/icon"
import { readableOn } from "@/lib/color"
import { cn } from "@/lib/utils"

/* Shared studio-branding controls, used by onboarding and studio settings. */

export const BRAND_SWATCHES = [
  { hex: "#F2A93B", name: "Marigold" },
  { hex: "#B5452B", name: "Sindoor" },
  { hex: "#7A1E2C", name: "Maroon" },
  { hex: "#2F5D50", name: "Emerald" },
  { hex: "#2B4C7E", name: "Indigo" },
  { hex: "#C9A27E", name: "Champagne" },
  { hex: "#1C1714", name: "Ink" },
  { hex: "#E9E3D8", name: "Ivory" },
]

/** Pick a brand colour: named swatches plus any custom colour. */
export function ColorPicker({ value, onChange, name }: { value: string; onChange: (hex: string) => void; name?: string }) {
  const custom = !BRAND_SWATCHES.some((s) => s.hex.toLowerCase() === value.toLowerCase())
  return (
    <div>
      {name && <input type="hidden" name={name} value={value} />}
      <div role="radiogroup" aria-label="Brand colour" className="flex flex-wrap gap-2">
        {BRAND_SWATCHES.map((s) => {
          const on = s.hex.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={s.hex}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={s.name}
              title={s.name}
              onClick={() => onChange(s.hex)}
              className={cn(
                "relative size-11 rounded-full border transition-[scale] active:scale-90",
                on ? "border-ink" : "border-line-strong/50"
              )}
              style={{ background: s.hex }}
            >
              {on && <span aria-hidden className="absolute -inset-1 rounded-full border-2 border-safelight-text" />}
            </button>
          )
        })}
        <label
          className={cn(
            "relative flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3 type-caption",
            custom ? "border-ink text-ink" : "border-line-strong/50 text-ink-muted hover:text-ink"
          )}
        >
          <span aria-hidden className="size-5 rounded-full border border-line-strong/50" style={{ background: custom ? value : "conic-gradient(#f2a93b,#b5452b,#2b4c7e,#2f5d50,#f2a93b)" }} />
          Custom
          <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="sr-only" aria-label="Custom brand colour" />
        </label>
      </div>
      <p className="mt-2 type-metric text-caption text-ink-muted">{value.toUpperCase()}</p>
    </div>
  )
}

/** Choose a logo file with drop or click; shows a preview and validation. */
export function LogoPicker({
  previewUrl,
  onFile,
  onRemove,
  busy = false,
}: {
  previewUrl: string | null
  onFile: (file: File) => void
  onRemove: () => void
  busy?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  const take = (file: File | undefined) => {
    if (!file) return
    const err = validateLogo(file)
    setError(err)
    if (!err) onFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex items-center gap-4 rounded-[var(--radius-control)] border border-dashed p-4 transition-colors",
          over ? "border-safelight bg-safelight-soft" : "border-line-strong"
        )}
      >
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-chip)] bg-surface-sunken">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/object URLs and SVG logos
            <img src={previewUrl} alt="Logo preview" className="max-h-14 max-w-14 object-contain" />
          ) : (
            <Icon name="image" className="size-6 text-ink-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-caption text-ink">{previewUrl ? "Logo added" : "Drop your logo here"}</p>
          <p className="type-caption font-normal text-ink-muted">PNG, JPG, WebP or SVG, up to 2 MB. Transparent works best.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="h-11 rounded-[var(--radius-control)] border border-line-strong px-4 type-caption text-ink transition-colors hover:border-ink disabled:opacity-50"
          >
            {previewUrl ? "Replace" : "Choose file"}
          </button>
          {previewUrl && (
            <button type="button" disabled={busy} onClick={onRemove} className="h-11 rounded-[var(--radius-control)] px-3 type-caption text-ink-muted hover:text-danger">
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            take(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>
      {error && <p className="mt-2 type-caption text-danger" role="alert">{error}</p>}
    </div>
  )
}

/**
 * Debounced address availability check. Calls the server only after typing
 * pauses, and ignores out-of-date answers.
 */
export function useSlugCheck(slug: string, enabled = true) {
  const [answer, setAnswer] = useState<{ slug: string; result: SlugCheck } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!enabled || slug.length < 3) return
    let current = true
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await checkSlugAction(slug)
        if (current) setAnswer({ slug, result: r })
      })
    }, 450)
    return () => {
      current = false
      clearTimeout(t)
    }
  }, [slug, enabled])

  // Only show an answer that belongs to what is typed now.
  const fresh = answer && answer.slug === slug && slug.length >= 3 ? answer.result : null
  return { result: fresh, checking: pending }
}

/**
 * Live preview of the client gallery cover: what couples will see.
 */
export function GalleryCoverPreview({
  studioName,
  slug,
  brandColor,
  logoUrl,
  compact = false,
}: {
  studioName: string
  slug: string
  brandColor: string
  logoUrl: string | null
  compact?: boolean
}) {
  const photos = useSitePhotos()
  return (
    <figure className="overflow-hidden rounded-[var(--radius-cover)] border border-line bg-surface-raised shadow-[var(--shadow-print)]">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span aria-hidden className="flex gap-1">
          <span className="size-2 rounded-full bg-line" />
          <span className="size-2 rounded-full bg-line" />
          <span className="size-2 rounded-full bg-line" />
        </span>
        <span className="mx-auto truncate rounded-[var(--radius-chip)] bg-surface-sunken px-2 py-0.5 type-metric text-micro text-ink-muted">
          framesly.app/<span className="text-ink">{slug || "your-studio"}</span>/aarohi-kabir
        </span>
      </div>
      <div className={cn("relative", compact ? "h-40" : "h-[300px] lg:h-[360px]")}>
        <Image src={photos.skyEmbrace.src} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-[50%_40%]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(20_16_14/0.82)] via-[rgb(20_16_14/0.15)] to-[rgb(20_16_14/0.4)]" />
        <div className="absolute top-4 left-4 flex items-center gap-2 text-white">
          <StudioLogo
            name={studioName || "Your studio"}
            logoUrl={logoUrl}
            alt=""
            imageClassName="max-h-9 max-w-[140px] drop-shadow"
            textClassName="text-caption tracking-[0.25em]"
          />
        </div>
        <span className="absolute top-4 right-4 rounded-full bg-white/85 px-2 py-0.5 type-label text-fixed-dark">Preview</span>
        <figcaption className="absolute inset-x-4 bottom-4 text-white">
          <p className={cn("font-heading leading-none font-bold tracking-[-0.03em]", compact ? "text-[26px]" : "text-[40px]")}>Aarohi & Kabir</p>
          <p className="mt-1.5 type-caption font-normal text-white/80">Udaipur · 12 to 14 February</p>
          <span
            className="mt-4 inline-flex h-9 items-center rounded-[var(--radius-control)] px-4 type-caption"
            style={{ background: brandColor, color: readableOn(brandColor) }}
          >
            View the photos
          </span>
        </figcaption>
      </div>
    </figure>
  )
}
