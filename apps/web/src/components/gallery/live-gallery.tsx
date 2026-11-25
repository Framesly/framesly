"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { GalleryView, makeLocalFavourites, type Favourites } from "@/components/gallery/client-gallery"
import type { GalleryPhoto, GallerySection, GalleryViewData } from "@/components/gallery/gallery-data"
import { ToastProvider } from "@/components/gallery/toast"
import type { ClientGalleryView } from "@/lib/data/client-gallery"

const REFRESH_BEFORE_EXPIRY = 10 * 60 // seconds: refetch links ~50 min into their 1-hour life

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** API view → what the gallery UI renders. Photos without a section go under "More photos". */
export function toViewData(g: ClientGalleryView): GalleryViewData {
  let frame = 0
  const toPhoto = (p: ClientGalleryView["photos"][number], section: string): GalleryPhoto => ({
    id: p.id,
    src: p.src,
    download: p.download,
    w: p.width ?? 3,
    h: p.height ?? 2,
    alt: p.name,
    frame: ++frame,
    section,
  })
  const known = new Set(g.sections.map((s) => s.id))
  const sections: GallerySection[] = g.sections
    .map((s) => ({ id: `s-${s.id}`, name: s.name, day: "", photos: g.photos.filter((p) => p.sectionId === s.id).map((p) => toPhoto(p, `s-${s.id}`)) }))
    .filter((s) => s.photos.length > 0)
  const loose = g.photos.filter((p) => !p.sectionId || !known.has(p.sectionId))
  if (loose.length) sections.push({ id: "more", name: sections.length ? "More photos" : "Photos", day: "", photos: loose.map((p) => toPhoto(p, "more")) })

  const all = sections.flatMap((s) => s.photos)
  const cover = all.find((p) => p.id === g.coverId) ?? all[0] ?? null
  return {
    studio: { name: g.studio.name, logoUrl: g.studio.logoUrl },
    couple: g.title,
    subtitle: g.eventDate ? dateFmt.format(new Date(g.eventDate)) : "",
    cover,
    sections,
    all,
  }
}

/** Starts a download of the original through its signed link. */
function downloadPhoto(p: GalleryPhoto) {
  if (!p.download) return
  const a = document.createElement("a")
  a.href = p.download
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * A real client gallery at /g/[slug]. Photo links last 1 hour, so this
 * refetches fresh ones shortly before they expire; if the gallery was
 * unpublished, expired or locked meanwhile, the page re-renders that state.
 */
export function LiveGallery({ slug, initial, useFavourites }: { slug: string; initial: ClientGalleryView; useFavourites?: () => Favourites }) {
  const router = useRouter()
  const [gallery, setGallery] = useState(initial)
  const data = useMemo(() => toViewData(gallery), [gallery])
  const localFavourites = useMemo(() => makeLocalFavourites(`framesly-favs:${slug}`), [slug])
  const favourites = (useFavourites ?? localFavourites)()

  useEffect(() => {
    const wait = Math.max(30, gallery.linksExpireAt - Math.floor(Date.now() / 1000) - REFRESH_BEFORE_EXPIRY) * 1000
    const t = setTimeout(async () => {
      const res = await fetch(`/api/g/${slug}`, { cache: "no-store" }).catch(() => null)
      if (res?.ok) setGallery(await res.json())
      else if (res) router.refresh()
    }, wait)
    return () => clearTimeout(t)
  }, [gallery.linksExpireAt, slug, router])

  return (
    <ToastProvider>
      <GalleryView data={data} favourites={favourites} onDownload={downloadPhoto} />
    </ToastProvider>
  )
}
