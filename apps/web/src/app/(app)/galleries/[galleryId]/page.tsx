import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { GalleryHeader } from "@/components/app/gallery-editor"
import { MetricStrip } from "@/components/app/metric-strip"
import { PhotoGrid } from "@/components/app/photo-grid"
import { PhotoUploader } from "@/components/app/photo-uploader"
import { ShareBar } from "@/components/app/publish-panel"
import { Icon } from "@/components/ui/icon"
import { requireStudio } from "@/lib/auth/dal"
import { siteOrigin } from "@/lib/auth/redirects"
import { getGalleryWithSections, getPublishState, listGalleryPhotos } from "@/lib/data/galleries"
import { toGridPhotos } from "@/lib/data/grid-photos"

export const metadata: Metadata = { title: "Gallery" }

/**
 * One gallery. Everything used often sits at the top: name, date, status,
 * sections, delete, and the client link with its key. Below: counts, upload,
 * then the photos. All reads start together; RLS limits each one to the
 * signed-in member's studio, and the studio check below guards the page.
 */
export default async function GalleryPage({ params, searchParams }: PageProps<"/galleries/[galleryId]">) {
  const [{ galleryId }, query] = await Promise.all([params, searchParams])
  const [{ studio }, data, photos, publish, origin] = await Promise.all([
    requireStudio(),
    getGalleryWithSections(galleryId),
    listGalleryPhotos(galleryId),
    getPublishState(galleryId),
    siteOrigin(),
  ])
  if (!data || data.gallery.studio_id !== studio.id) notFound()
  const { gallery, sections } = data
  const gridPhotos = toGridPhotos(photos)

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <Link href="/galleries" className="-ml-1 inline-flex h-10 items-center gap-1.5 rounded-full pr-3 pl-1 type-caption text-ink-muted hover:text-ink">
        <Icon name="chevron-left" className="size-4" />
        All galleries
      </Link>
      {query.created === "1" && (
        <p role="status" className="mt-2 mb-4 rounded-[var(--radius-control)] border border-safelight/40 bg-safelight-soft px-4 py-3 text-ink">
          Gallery created. Next, upload the wedding.
        </p>
      )}

      <div className="mt-1">
        <GalleryHeader id={gallery.id} title={gallery.title} eventDate={gallery.event_date} status={gallery.status} coverMode={publish?.cover_mode ?? "single"} sections={sections} />
      </div>

      <div className="mt-5 space-y-3">
        <ShareBar
          galleryId={gallery.id}
          title={gallery.title}
          origin={origin}
          initial={{
            publicSlug: publish?.public_slug ?? null,
            publishedAt: publish?.published_at ?? null,
            expiresAt: publish?.expires_at ?? null,
            hasPassword: publish?.has_password ?? false,
            key: publish?.key ?? null,
          }}
        />
        <MetricStrip
          metrics={[
            { label: "Photos", value: gallery.photo_count },
            { label: "Ready", value: gallery.ready_count },
            { label: "Failed", value: gallery.failed_count, tone: "danger" },
          ]}
          link={{ href: `/galleries/${gallery.id}/picks`, label: "Client picks" }}
        />
        <PhotoUploader galleryId={gallery.id} unfinished={Math.max(0, gallery.photo_count - gallery.ready_count)} />
      </div>

      <PhotoGrid galleryId={gallery.id} initial={gridPhotos} total={gallery.photo_count} sections={sections.map((s) => ({ id: s.id, name: s.name }))} coverId={gallery.cover_photo_id} />
    </div>
  )
}
