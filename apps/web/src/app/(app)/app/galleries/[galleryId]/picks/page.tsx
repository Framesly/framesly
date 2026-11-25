import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AutoRefresh, FilenameList } from "@/components/app/picks-tools"
import { requireStudio } from "@/lib/auth/dal"
import { getGalleryWithSections } from "@/lib/data/galleries"
import { presignGet } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/components/ui/icon"

export const metadata: Metadata = { title: "Client picks" }

/**
 * The photos a couple hearted, refreshed every few seconds.
 * RLS limits selections to the signed-in photographer's studio.
 */
export default async function PicksPage({ params }: PageProps<"/app/galleries/[galleryId]/picks">) {
  const [{ galleryId }, { studio }] = await Promise.all([params, requireStudio()])
  const data = await getGalleryWithSections(galleryId)
  if (!data || data.gallery.studio_id !== studio.id) notFound()

  const supabase = await createClient()
  const { data: picks } = await supabase.from("selections").select("photo_id, visitor_id, created_at").eq("gallery_id", galleryId)
  const byPhoto = new Map<string, { hearts: number; last: string }>()
  for (const p of picks ?? []) {
    const cur = byPhoto.get(p.photo_id)
    byPhoto.set(p.photo_id, { hearts: (cur?.hearts ?? 0) + 1, last: !cur || p.created_at > cur.last ? p.created_at : cur.last })
  }
  const visitors = new Set((picks ?? []).map((p) => p.visitor_id)).size

  const ids = [...byPhoto.keys()]
  const { data: photos } = ids.length
    ? await supabase.from("photos").select("id, original_name, web_key").in("id", ids)
    : { data: [] as { id: string; original_name: string; web_key: string | null }[] }
  const rows = await Promise.all(
    (photos ?? [])
      .map((p) => ({ ...p, ...byPhoto.get(p.id)! }))
      .sort((a, b) => b.hearts - a.hearts || a.original_name.localeCompare(b.original_name))
      .map(async (p) => ({ ...p, src: p.web_key ? await presignGet(p.web_key) : null }))
  )

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <AutoRefresh seconds={5} />
      <Link href={`/app/galleries/${galleryId}`} className="inline-flex h-11 items-center gap-2 type-caption text-ink-muted hover:text-ink">
        <Icon name="chevron-left" className="size-4" />
        {data.gallery.title}
      </Link>
      <h1 className="mt-2 type-heading-1 md:type-display-l">Client picks</h1>
      <p className="mt-2 text-ink-muted">
        {rows.length
          ? `${rows.length.toLocaleString("en")} ${rows.length === 1 ? "photo" : "photos"} hearted${visitors > 1 ? ` by ${visitors} people` : ""}. Updates by itself.`
          : "No hearts yet. When your couple hearts photos, they appear here within seconds."}
      </p>

      {rows.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rows.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-[var(--radius-chip)] border border-line bg-surface-raised">
                <div className="relative aspect-[4/5] bg-surface-sunken">
                  {p.src && <Image src={p.src} alt={p.original_name} fill unoptimized sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />}
                </div>
                <p className="flex items-center justify-between gap-2 px-2.5 py-2 type-caption text-ink">
                  <span className="truncate">{p.original_name}</span>
                  {p.hearts > 1 && <span className="shrink-0 text-ink-muted">♥ {p.hearts}</span>}
                </p>
              </li>
            ))}
          </ul>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FilenameList names={rows.map((p) => p.original_name)} />
          </aside>
        </div>
      )}
    </div>
  )
}
