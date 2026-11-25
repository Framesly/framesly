"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { GalleryView, type Favourites } from "@/components/gallery/client-gallery"
import type { GalleryPhoto, GallerySection, GalleryViewData } from "@/components/gallery/gallery-data"
import { ToastProvider, useToast } from "@/components/gallery/toast"
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
 * Hearts saved on the server (stage 5), keyed to this browser's visitor
 * cookie. The heart flips at once and flips back if saving fails.
 */
function useServerFavourites(slug: string, initial: string[]): Favourites {
  const toast = useToast()
  const [favs, setFavs] = useState(() => new Set(initial))
  const toggle = useCallback(
    (id: string) => {
      const on = !favs.has(id)
      setFavs((prev) => {
        const next = new Set(prev)
        if (on) next.add(id)
        else next.delete(id)
        return next
      })
      fetch(`/api/g/${slug}/favourite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoId: id, on }) })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status))
        })
        .catch(() => {
          setFavs((prev) => {
            const next = new Set(prev)
            if (on) next.delete(id)
            else next.add(id)
            return next
          })
          toast({ title: "Couldn't save that heart", body: "Check your connection and try again." })
        })
    },
    [favs, slug, toast]
  )
  return { favs, toggle, has: (id: string) => favs.has(id) }
}

/**
 * A real client gallery at /g/[slug]. Photo links last 1 hour, so this
 * refetches fresh ones shortly before they expire; if the gallery was
 * unpublished, expired or locked meanwhile, the page re-renders that state.
 */
export function LiveGallery({ slug, initial }: { slug: string; initial: ClientGalleryView }) {
  return (
    <ToastProvider>
      <LiveGalleryInner slug={slug} initial={initial} />
    </ToastProvider>
  )
}

function LiveGalleryInner({ slug, initial }: { slug: string; initial: ClientGalleryView }) {
  const router = useRouter()
  const [gallery, setGallery] = useState(initial)
  const data = useMemo(() => toViewData(gallery), [gallery])
  const favourites = useServerFavourites(slug, initial.favourites)

  useEffect(() => {
    const wait = Math.max(30, gallery.linksExpireAt - Math.floor(Date.now() / 1000) - REFRESH_BEFORE_EXPIRY) * 1000
    const t = setTimeout(async () => {
      const res = await fetch(`/api/g/${slug}`, { cache: "no-store" }).catch(() => null)
      if (res?.ok) setGallery(await res.json())
      else if (res) router.refresh()
    }, wait)
    return () => clearTimeout(t)
  }, [gallery.linksExpireAt, slug, router])

  return <GalleryView data={data} favourites={favourites} onDownload={downloadPhoto} />
}
