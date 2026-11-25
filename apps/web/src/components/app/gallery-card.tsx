import Link from "next/link"

import type { GalleryOverview } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

const statusLabel: Record<GalleryOverview["status"], string> = {
  draft: "Draft",
  culling: "Culling",
  delivered: "Delivered",
  archived: "Archived",
}

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

/**
 * A gallery on the dashboard. Photo-first: the cover fills the card; until
 * the gallery has photos it shows a print-style placeholder tinted with the
 * studio colour.
 */
export function GalleryCard({ gallery, brandColor }: { gallery: GalleryOverview; brandColor: string }) {
  const initials = gallery.title
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join(" & ")
  return (
    <Link
      href={`/app/galleries/${gallery.id}`}
      className="group block overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `color-mix(in oklab, ${brandColor} 22%, var(--surface-sunken))` }}>
        <span aria-hidden className="absolute inset-0 grid place-items-center font-heading text-[44px] font-bold tracking-[-0.03em] text-ink/25 transition-[scale] duration-500 group-hover:scale-105">
          {initials || "—"}
        </span>
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-0.5 type-caption",
            gallery.status === "delivered" ? "bg-success text-surface" : "bg-surface-raised/90 text-ink"
          )}
        >
          {statusLabel[gallery.status]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate type-heading-2 text-ink">{gallery.title}</h3>
        <p className="mt-1 flex flex-wrap gap-x-3 type-caption font-normal text-ink-muted">
          <span>{gallery.event_date ? dateFmt.format(new Date(gallery.event_date)) : "No date"}</span>
          <span className="tabular-nums">
            {gallery.photo_count.toLocaleString("en")} {gallery.photo_count === 1 ? "photo" : "photos"}
          </span>
          <span className="tabular-nums">
            {gallery.section_count} {gallery.section_count === 1 ? "section" : "sections"}
          </span>
        </p>
      </div>
    </Link>
  )
}
