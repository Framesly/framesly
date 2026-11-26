"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { GalleryView, type Favourites } from "@/components/gallery/client-gallery"
import type { GalleryPhoto, GallerySection, GalleryViewData } from "@/components/gallery/gallery-data"
import { ToastProvider, useToast } from "@/components/ui/toast"
import type { ClientGalleryView } from "@/lib/data/client-gallery"

const REFRESH_BEFORE_EXPIRY = 10 * 60 // seconds: refetch links well before they expire
const RECHECK_AFTER_MS = 30_000 // returning to the tab re-checks the gallery at most this often

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** API view → what the gallery UI renders. Photos without a section go under "More photos". */
function toViewData(g: ClientGalleryView): GalleryViewData {
  let frame = 0
  const toPhoto = (p: ClientGalleryView["photos"][number], section: string): GalleryPhoto => ({
    id: p.id,
    src: p.src,
    thumb: p.thumb,
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
    studio: { name: g.studio.name, logoUrl: g.studio.logoUrl, brandColor: g.studio.brandColor },
    couple: g.title,
    coverMode: g.coverMode,
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

/** File names for a batch: the original names, with duplicates numbered ("DSC_0001 (2).jpg"). */
function uniqueNames(photos: GalleryPhoto[]) {
  const seen = new Map<string, number>()
  return photos.map((p) => {
    const name = p.alt || `photo-${p.frame}.jpg`
    const n = (seen.get(name) ?? 0) + 1
    seen.set(name, n)
    if (n === 1) return name
    const dot = name.lastIndexOf(".")
    return dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`
  })
}

type SaveFilePicker = (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
  createWritable: () => Promise<WritableStream>
}>

/**
 * Download several originals. Where the browser can write a file directly
 * (Chrome, Edge), they are zipped as they stream in and written straight to
 * disk, so even a whole wedding never sits in memory. Elsewhere each photo
 * downloads on its own, one after another.
 */
async function downloadMany(slug: string, photos: GalleryPhoto[], onProgress: (done: number, total: number) => void, toast: ReturnType<typeof useToast>) {
  const files = photos.filter((p) => p.download)
  if (files.length === 1) return downloadPhoto(files[0])
  if (!files.length) return

  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker
  if (picker) {
    let handle: Awaited<ReturnType<SaveFilePicker>>
    try {
      handle = await picker({ suggestedName: `${slug}-${files.length}-photos.zip`, types: [{ description: "ZIP archive", accept: { "application/zip": [".zip"] } }] })
    } catch {
      return // cancelled the save dialog
    }
    const { downloadZip } = await import("client-zip")
    const names = uniqueNames(files)
    let done = 0
    async function* entries() {
      for (const [i, p] of files.entries()) {
        const res = await fetch(p.download!)
        if (!res.ok) throw new Error(`Couldn't fetch ${names[i]}`)
        yield { name: names[i], input: res }
        onProgress(++done, files.length)
      }
    }
    try {
      await downloadZip(entries()).body!.pipeTo(await handle.createWritable())
      toast({ title: `Saved ${files.length} photos`, body: "Full-size originals, in one ZIP.", tone: "success" })
    } catch {
      toast({ title: "The download stopped", body: "Check your connection and try again." })
    }
    return
  }

  toast({ title: `Downloading ${files.length} photos`, body: "If your browser asks, allow this page to download several files." })
  for (const [i, p] of files.entries()) {
    downloadPhoto(p)
    onProgress(i + 1, files.length)
    await new Promise((r) => setTimeout(r, 700))
  }
}

/** The gallery stopped being viewable here: unpublished or unknown (404), expired (410), or its key changed (401). */
const GONE = new Set([401, 404, 410])

/**
 * Hearts saved on the server, keyed to this browser's visitor
 * cookie. The heart flips at once and flips back if saving fails;
 * if the gallery is no longer viewable, `onGone` switches the screen.
 */
function useServerFavourites(slug: string, initial: string[], onGone: () => void): Favourites {
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
        .catch((e: Error) => {
          setFavs((prev) => {
            const next = new Set(prev)
            if (on) next.delete(id)
            else next.add(id)
            return next
          })
          if (GONE.has(Number(e.message))) onGone()
          else toast({ title: "Couldn't save that heart", body: "Check your connection and try again." })
        })
    },
    [favs, slug, toast, onGone]
  )
  return { favs, toggle, has: (id: string) => favs.has(id) }
}

/**
 * A real client gallery at /g/[slug]. It re-checks the gallery shortly
 * before the photo links expire, and whenever the couple comes back to the
 * tab (at most every 30 seconds). New photos appear; if the gallery was
 * unpublished, expired or its key changed meanwhile, the page switches to
 * that screen instead of leaving dead photos on show.
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
  const gone = useCallback(() => router.refresh(), [router])
  const favourites = useServerFavourites(slug, initial.favourites, gone)
  const lastCheck = useRef(0)

  const recheck = useCallback(async () => {
    lastCheck.current = Date.now()
    const res = await fetch(`/api/g/${slug}`, { cache: "no-store" }).catch(() => null)
    if (res?.ok) setGallery(await res.json())
    else if (res && GONE.has(res.status)) gone()
  }, [slug, gone])

  // Fresh links before the current ones run out.
  useEffect(() => {
    const wait = Math.max(30, gallery.linksExpireAt - Math.floor(Date.now() / 1000) - REFRESH_BEFORE_EXPIRY) * 1000
    const t = setTimeout(recheck, wait)
    return () => clearTimeout(t)
  }, [gallery.linksExpireAt, recheck])

  // Coming back to the tab: the photographer may have unpublished, changed the key or added photos.
  useEffect(() => {
    lastCheck.current = Date.now()
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > RECHECK_AFTER_MS) void recheck()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [recheck])

  const toast = useToast()
  const many = useCallback((photos: GalleryPhoto[], onProgress: (done: number, total: number) => void) => downloadMany(slug, photos, onProgress, toast), [slug, toast])

  return <GalleryView data={data} favourites={favourites} onDownload={downloadPhoto} onDownloadMany={many} />
}
