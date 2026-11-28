import type { Metadata } from "next"

import { GalleryList } from "@/components/app/gallery-list"
import { NewGalleryDialog } from "@/components/app/new-gallery-dialog"
import { requireStudio } from "@/lib/auth/dal"
import { listGalleries, listGalleryCovers } from "@/lib/data/galleries"

export const metadata: Metadata = { title: "Uploads" }

/**
 * Pick the gallery to upload into: the same cover cards and Grid / List /
 * Large switch as the dashboard. Uploading happens on each gallery's page.
 */
export default async function UploadsPage() {
  const { studio } = await requireStudio()
  const galleries = await listGalleries(studio.id)
  const covers = await listGalleryCovers(galleries)

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-heading-1 md:type-display-l">Uploads</h1>
          <p className="mt-2 max-w-xl text-ink-muted">Photos go into a gallery. Pick one, or start a gallery for the next wedding.</p>
        </div>
        {galleries.length > 0 && <NewGalleryDialog />}
      </div>

      {galleries.length === 0 ? (
        <section aria-labelledby="no-galleries" className="mt-8 flex flex-col items-center rounded-[var(--radius-cover)] border border-dashed border-line-strong px-6 py-14 text-center">
          <h2 id="no-galleries" className="type-heading-2">No galleries yet</h2>
          <p className="mt-2 max-w-sm type-caption font-normal text-ink-muted">Create a gallery for the wedding, then drop in the photos.</p>
          <div className="mt-6">
            <NewGalleryDialog label="Create a gallery" />
          </div>
        </section>
      ) : (
        <GalleryList items={galleries.map((g) => ({ gallery: g, cover: covers.get(g.id) ?? null }))} brandColor={studio.brand_color} />
      )}
    </div>
  )
}
