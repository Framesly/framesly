import type { Metadata } from "next"

import { GalleryList } from "@/components/app/gallery-list"
import { MetricStrip } from "@/components/app/metric-strip"
import { NewGalleryDialog } from "@/components/app/new-gallery-dialog"
import { Viewfinder } from "@/components/ui/viewfinder"
import { requireStudio } from "@/lib/auth/dal"
import { listGalleries, listGalleryCovers } from "@/lib/data/galleries"

export const metadata: Metadata = { title: "Galleries" }

/** Dashboard home: the studio's galleries, newest first. */
export default async function GalleriesPage({ searchParams }: PageProps<"/app">) {
  const [{ studio, user }, params] = await Promise.all([requireStudio(), searchParams])
  const galleries = await listGalleries(studio.id)
  const covers = await listGalleryCovers(galleries)
  const welcome = params.welcome === "1"
  const totals = galleries.reduce(
    (t, g) => ({ photos: t.photos + g.photo_count, delivered: t.delivered + (g.status === "delivered" ? 1 : 0) }),
    { photos: 0, delivered: 0 }
  )
  const firstName = user.fullName.split(" ")[0]

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      {welcome && (
        <div role="status" className="mb-8 flex items-start gap-3 rounded-[var(--radius-control)] border border-safelight/40 bg-safelight-soft px-4 py-3">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-safelight" />
          <p className="text-ink">
            {studio.name} is set up{firstName ? `, ${firstName}` : ""}. Create your first gallery to start uploading.
          </p>
        </div>
      )}
      {params.deleted === "1" && <p role="status" className="mb-6 type-caption font-normal text-ink-muted">Gallery deleted.</p>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="type-heading-1 md:type-display-l">Galleries</h1>
        {galleries.length > 0 && <NewGalleryDialog />}
      </div>

      <div className="mt-6">
        <MetricStrip
          metrics={[
            { label: "Galleries", value: galleries.length },
            { label: "Photos", value: totals.photos },
            { label: "Delivered", value: totals.delivered },
          ]}
        />
      </div>

      {galleries.length === 0 ? (
        <section className="grain relative mt-8 flex flex-col items-center rounded-[var(--radius-cover)] border border-line bg-surface-raised px-6 py-16 text-center" aria-labelledby="empty-title">
          <div className="relative grid size-24 place-items-center">
            <Viewfinder size={18} />
            <span className="size-3 rounded-full" style={{ background: studio.brand_color, boxShadow: `0 0 30px 10px ${studio.brand_color}40` }} />
          </div>
          <h2 id="empty-title" className="mt-8 type-heading-1">Create your first gallery</h2>
          <p className="mt-3 max-w-md text-ink-muted">
            Name the wedding and choose its events. Then drop in every card from every shooter.
          </p>
          <div className="mt-8">
            <NewGalleryDialog label="Create a gallery" />
          </div>
        </section>
      ) : (
        <GalleryList items={galleries.map((g) => ({ gallery: g, cover: covers.get(g.id) ?? null }))} brandColor={studio.brand_color} />
      )}
    </div>
  )
}
