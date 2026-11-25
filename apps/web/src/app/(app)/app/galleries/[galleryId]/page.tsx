import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"


import { DeleteGallery, GalleryDetails, SectionsManager } from "@/components/app/gallery-editor"
import { PhotoGrid } from "@/components/app/photo-grid"
import { PhotoUploader } from "@/components/app/photo-uploader"
import { PublishPanel } from "@/components/app/publish-panel"
import { requireStudio } from "@/lib/auth/dal"
import { siteOrigin } from "@/lib/auth/redirects"
import { getGalleryWithSections, getPublishState, listGalleryPhotos } from "@/lib/data/galleries"
import { toGridPhotos } from "@/lib/data/grid-photos"
import { Icon } from "@/components/ui/icon"

export const metadata: Metadata = { title: "Gallery" }

/** One gallery: details, uploads, photos and sections. */
export default async function GalleryPage({ params, searchParams }: PageProps<"/app/galleries/[galleryId]">) {
  const [{ galleryId }, query, { studio }] = await Promise.all([params, searchParams, requireStudio()])
  const data = await getGalleryWithSections(galleryId)
  if (!data || data.gallery.studio_id !== studio.id) notFound()
  const { gallery, sections } = data
  const [photos, publish, origin] = await Promise.all([listGalleryPhotos(galleryId), getPublishState(galleryId), siteOrigin()])
  const gridPhotos = await toGridPhotos(photos)

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <Link href="/app" className="inline-flex h-11 items-center gap-2 type-caption text-ink-muted hover:text-ink">
        <Icon name="chevron-left" className="size-4" />
        All galleries
      </Link>
      {query.created === "1" && (
        <p role="status" className="mt-2 mb-4 rounded-[var(--radius-control)] border border-safelight/40 bg-safelight-soft px-4 py-3 text-ink">
          Gallery created. Next, upload the wedding.
        </p>
      )}

      <div className="mt-2">
        <GalleryDetails id={gallery.id} title={gallery.title} eventDate={gallery.event_date} status={gallery.status} />
      </div>

      <dl className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {[
          { label: "Photos", value: gallery.photo_count },
          { label: "Ready", value: gallery.ready_count },
          { label: "Failed", value: gallery.failed_count },
        ].map((m) => (
          <div key={m.label} className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-4">
            <dt className="type-caption font-normal text-ink-muted">{m.label}</dt>
            <dd className="mt-1 type-metric text-stat leading-8 text-ink">{m.value.toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={`/app/galleries/${gallery.id}/picks`}
        className="mt-3 flex items-center justify-between rounded-[var(--radius-control)] border border-line bg-surface-raised px-4 py-3 type-caption text-ink hover:border-line-strong"
      >
        <span>Client picks</span>
        <span className="text-ink-muted">See what your couple hearted →</span>
      </Link>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PhotoUploader galleryId={gallery.id} unfinished={Math.max(0, gallery.photo_count - gallery.ready_count)} />
        <div className="space-y-6">
          <PublishPanel
            galleryId={gallery.id}
            title={gallery.title}
            origin={origin}
            initial={{
              publicSlug: publish?.public_slug ?? null,
              publishedAt: publish?.published_at ?? null,
              expiresAt: publish?.expires_at ?? null,
              hasPassword: publish?.has_password ?? false,
            }}
          />
          <SectionsManager galleryId={gallery.id} sections={sections} />
          <DeleteGallery id={gallery.id} title={gallery.title} />
        </div>
      </div>

      <PhotoGrid galleryId={gallery.id} initial={gridPhotos} total={gallery.photo_count} sections={sections.map((s) => ({ id: s.id, name: s.name }))} coverId={gallery.cover_photo_id} />
    </div>
  )
}
