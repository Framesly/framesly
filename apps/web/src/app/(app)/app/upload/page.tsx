import type { Metadata } from "next"

import { NewGalleryDialog } from "@/components/app/new-gallery-dialog"
import { ButtonLink } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { requireStudio } from "@/lib/auth/dal"
import { listGalleries } from "@/lib/data/galleries"

export const metadata: Metadata = { title: "Uploads" }

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

/** Pick the gallery to upload into. Uploading itself happens on each gallery's page. */
export default async function UploadsPage() {
  const { studio } = await requireStudio()
  const galleries = await listGalleries(studio.id)

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
        <>
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised">
            {galleries.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{g.title}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 type-caption font-normal text-ink-muted">
                    <span>{g.event_date ? dateFmt.format(new Date(g.event_date)) : "No date"}</span>
                    <span className="tabular-nums">{g.photo_count.toLocaleString("en")} {g.photo_count === 1 ? "photo" : "photos"}</span>
                    {g.failed_count > 0 && <span className="text-danger tabular-nums">{g.failed_count} failed</span>}
                  </p>
                </div>
                <ButtonLink href={`/app/galleries/${g.id}`} size="sm" variant="secondary">
                  <Icon name="upload" className="size-4" />
                  Upload
                </ButtonLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
