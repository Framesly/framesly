import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { FallbackImage } from "@/components/ui/fallback-image"
import { Icon } from "@/components/ui/icon"
import type { GalleryOverview } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

export type GalleryView = "grid" | "list" | "large"
/** Signed cover links: the thumbnail, and the web copy for covers uploaded before thumbnails. */
export type CoverUrls = { thumb: string; full: string }

const statusLabel: Record<GalleryOverview["status"], string> = {
  draft: "Draft",
  culling: "Culling",
  delivered: "Delivered",
  archived: "Archived",
}

const statusTone: Record<GalleryOverview["status"], "neutral" | "info" | "success"> = {
  draft: "neutral",
  culling: "info",
  delivered: "success",
  archived: "neutral",
}

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

function initialsOf(title: string) {
  return title
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join(" & ")
}

function Cover({ gallery, brandColor, cover, sizes, small }: { gallery: GalleryOverview; brandColor: string; cover: CoverUrls | null; sizes: string; small?: boolean }) {
  return cover ? (
    // The title names the gallery, so the photo is decorative. Signed URLs vary, so skip the optimiser.
    <FallbackImage src={cover.thumb} fallback={cover.full} alt="" fill unoptimized sizes={sizes} className="object-cover transition-[scale] duration-500 group-hover:scale-[1.04]" />
  ) : (
    <span
      aria-hidden
      className={cn("absolute inset-0 grid place-items-center font-heading font-bold tracking-[-0.03em] text-ink/25", small ? "text-body" : "text-[32px]")}
      style={{ background: `color-mix(in oklab, ${brandColor} 22%, var(--surface-sunken))` }}
    >
      {initialsOf(gallery.title) || "—"}
    </span>
  )
}

function Meta({ gallery }: { gallery: GalleryOverview }) {
  return (
    <>
      <span>{gallery.event_date ? dateFmt.format(new Date(gallery.event_date)) : "No date"}</span>
      <span className="tabular-nums">
        {gallery.photo_count.toLocaleString("en")} {gallery.photo_count === 1 ? "photo" : "photos"}
      </span>
    </>
  )
}

/**
 * A gallery on the dashboard, in one of three layouts: a compact photo tile
 * (grid), a row (list) or a big cover card (large). Until the gallery has
 * photos the cover is a placeholder tinted with the studio colour.
 */
export function GalleryCard({ gallery, brandColor, cover, view = "grid" }: { gallery: GalleryOverview; brandColor: string; cover: CoverUrls | null; view?: GalleryView }) {
  const href = `/galleries/${gallery.id}`

  if (view === "list") {
    return (
      <Link href={href} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-overlay sm:gap-4 sm:px-4">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-chip)] bg-surface-sunken sm:size-14">
          <Cover gallery={gallery} brandColor={brandColor} cover={cover} sizes="56px" small />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{gallery.title}</span>
          <span className="mt-0.5 flex flex-wrap gap-x-3 type-caption font-normal text-ink-muted">
            <Meta gallery={gallery} />
            <span className="hidden tabular-nums sm:inline">
              {gallery.section_count} {gallery.section_count === 1 ? "section" : "sections"}
            </span>
          </span>
        </span>
        <Badge tone={statusTone[gallery.status]} className="shrink-0">
          {statusLabel[gallery.status]}
        </Badge>
        <Icon name="chevron-right" className="hidden size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 sm:block" />
      </Link>
    )
  }

  const large = view === "large"
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className={cn("relative overflow-hidden bg-surface-sunken", large ? "aspect-[4/3]" : "aspect-[3/2]")}>
        <Cover
          gallery={gallery}
          brandColor={brandColor}
          cover={cover}
          sizes={large ? "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
        />
        <Badge variant="solid" tone={statusTone[gallery.status]} className={cn("absolute", large ? "top-3 left-3" : "top-2 left-2")}>
          {statusLabel[gallery.status]}
        </Badge>
      </div>
      <div className={large ? "p-4" : "px-3 py-2.5"}>
        <h3 className={cn("truncate text-ink", large ? "type-heading-2" : "font-semibold")}>{gallery.title}</h3>
        <p className="mt-0.5 flex flex-wrap gap-x-3 type-caption font-normal text-ink-muted">
          <Meta gallery={gallery} />
        </p>
      </div>
    </Link>
  )
}
