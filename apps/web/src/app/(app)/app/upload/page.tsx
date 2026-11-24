import type { Metadata } from "next"

import { NewGalleryDialog } from "@/components/app/new-gallery-dialog"
import { ButtonLink } from "@/components/ui/button"
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
      <h1 className="type-heading-1 md:type-display-l">Uploads</h1>
      <p className="mt-4 max-w-xl type-body-l text-ink-muted">
        Photos are uploaded into a gallery. Pick one below, or start a new gallery for the next wedding.
      </p>

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
          <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised">
            {galleries.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate type-heading-2 text-ink">{g.title}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 type-caption font-normal text-ink-muted">
                    <span>{g.event_date ? dateFmt.format(new Date(g.event_date)) : "No date"}</span>
                    <span className="tabular-nums">{g.photo_count.toLocaleString("en")} {g.photo_count === 1 ? "photo" : "photos"}</span>
                    {g.failed_count > 0 && <span className="text-danger tabular-nums">{g.failed_count} failed</span>}
                  </p>
                </div>
                <ButtonLink href={`/app/galleries/${g.id}`} variant="secondary">Upload photos</ButtonLink>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <NewGalleryDialog />
          </div>
        </>
      )}
    </div>
  )
}
