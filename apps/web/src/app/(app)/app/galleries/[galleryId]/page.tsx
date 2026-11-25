import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import Image from "next/image"

import { DeleteGallery, GalleryDetails, SectionsManager } from "@/components/app/gallery-editor"
import { PhotoUploader } from "@/components/app/photo-uploader"
import { PublishPanel } from "@/components/app/publish-panel"
import { requireStudio } from "@/lib/auth/dal"
import { siteOrigin } from "@/lib/auth/redirects"
import { getGalleryWithSections, getPublishState, listGalleryPhotos } from "@/lib/data/galleries"
import { presignGet } from "@/lib/r2"

export const metadata: Metadata = { title: "Gallery" }

/** One gallery: details, uploads, photos and sections. */
export default async function GalleryPage({ params, searchParams }: PageProps<"/app/galleries/[galleryId]">) {
  const [{ galleryId }, query, { studio }] = await Promise.all([params, searchParams, requireStudio()])
  const data = await getGalleryWithSections(galleryId)
  if (!data || data.gallery.studio_id !== studio.id) notFound()
  const { gallery, sections } = data
  const [photos, publish, origin] = await Promise.all([listGalleryPhotos(galleryId), getPublishState(galleryId), siteOrigin()])
  const thumbs = await Promise.all(photos.map(async (p) => ({ ...p, src: p.status === "ready" && p.web_key ? await presignGet(p.web_key) : null })))

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <Link href="/app" className="inline-flex h-11 items-center gap-2 type-caption text-ink-muted hover:text-ink">
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden><path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "Photos", value: gallery.photo_count },
          { label: "Ready", value: gallery.ready_count },
          { label: "Failed", value: gallery.failed_count },
        ].map((m) => (
          <div key={m.label} className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-4">
            <dt className="type-caption font-normal text-ink-muted">{m.label}</dt>
            <dd className="mt-1 type-metric text-[22px] leading-8 text-ink">{m.value.toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PhotoUploader galleryId={gallery.id} />
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

      {thumbs.length > 0 && (
        <section aria-labelledby="photos-title" className="mt-10">
          <h2 id="photos-title" className="type-heading-2">Photos</h2>
          <p className="mt-1 type-caption font-normal text-ink-muted">
            {gallery.photo_count > thumbs.length ? `Showing the latest ${thumbs.length} of ${gallery.photo_count.toLocaleString("en")}.` : `${gallery.photo_count.toLocaleString("en")} in this gallery.`}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {thumbs.map((p) => (
              <li key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-chip)] bg-surface-sunken">
                {p.src ? (
                  <Image src={p.src} alt={p.original_name} fill unoptimized sizes="(min-width: 1024px) 16vw, 25vw" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center px-2 text-center type-caption font-normal text-ink-muted">
                    {p.status === "failed" ? "Failed" : "Uploading…"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
