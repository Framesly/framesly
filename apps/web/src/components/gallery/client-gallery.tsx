"use client"

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import { buildSampleGallery, type GalleryPhoto, type GalleryViewData } from "@/components/gallery/gallery-data"
import { HeartButton } from "@/components/gallery/heart-button"
import { Lightbox } from "@/components/gallery/lightbox"
import { ToastProvider, useToast } from "@/components/ui/toast"
import { SkipLink } from "@/components/ui/skip-link"
import { useSitePhotos } from "@/components/site/site-photos"
import { StudioLogo } from "@/components/studio/studio-logo"
import { TransitionLink as Link } from "@/components/transition/page-transition"
import { ACCENT_SURFACES, brandAccentStyle } from "@/lib/color"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

const develop = [0.22, 1, 0.36, 1] as const
const FAV_KEY = "framesly-favs:saffron-lane/aarohi-kabir"

export type Favourites = { favs: Set<string>; toggle: (id: string) => void; has: (id: string) => boolean }

/*
 * Browser-only favourites (the sample gallery). A tiny external store per key
 * keeps server and client renders in agreement and syncs across tabs.
 */
function makeLocalFavourites(key: string) {
  const listeners = new Set<() => void>()
  let memory = "[]"
  const read = () => {
    try {
      return localStorage.getItem(key) ?? memory
    } catch {
      return memory
    }
  }
  const write = (value: string) => {
    memory = value
    try {
      localStorage.setItem(key, value)
    } catch {}
    listeners.forEach((l) => l())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    window.addEventListener("storage", listener)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", listener)
    }
  }
  return function useLocalFavourites(): Favourites {
    const raw = useSyncExternalStore(subscribe, read, () => "[]")
    const favs = useMemo(() => {
      try {
        return new Set<string>(JSON.parse(raw))
      } catch {
        return new Set<string>()
      }
    }, [raw])
    const toggle = useCallback((id: string) => {
      const next = new Set<string>(JSON.parse(read()))
      if (next.has(id)) next.delete(id)
      else next.add(id)
      write(JSON.stringify([...next]))
    }, [])
    return { favs, toggle, has: (id: string) => favs.has(id) }
  }
}

const useSampleFavourites = makeLocalFavourites(FAV_KEY)

/** The public sample gallery (/sample), built from the site photo catalogue. */
export function ClientGallery() {
  return (
    <ToastProvider>
      <SampleGallery />
    </ToastProvider>
  )
}

function SampleGallery() {
  const photos = useSitePhotos()
  const g = useMemo(() => buildSampleGallery(photos), [photos])
  const favourites = useSampleFavourites()
  const toast = useToast()
  const data = useMemo<GalleryViewData>(
    () => ({ studio: g.studio, couple: g.couple, subtitle: `${g.place} · ${g.dates}`, cover: g.cover, sections: g.sections, all: g.all }),
    [g]
  )
  return (
    <GalleryView
      data={data}
      sample
      favourites={favourites}
      onDownload={(p) => toast({ title: "Download started", body: `Full-size file for frame ${p.frame}.`, tone: "success" })}
    />
  )
}

/**
 * The client gallery: cover, section bar, masonry grid, lightbox, favourites
 * and download. Used by the sample and by real galleries (/g/[slug]).
 * Render inside <ToastProvider>.
 */
export function GalleryView({
  data: g,
  sample = false,
  favourites,
  onDownload,
}: {
  data: GalleryViewData
  sample?: boolean
  favourites: Favourites
  onDownload: (p: GalleryPhoto) => void
}) {
  const toast = useToast()
  const { favs, toggle, has } = favourites
  const [view, setView] = useState<"all" | "favourites">("all")
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [active, setActive] = useState(g.sections[0]?.id ?? "")

  // The studio's colour drives the accent (hearts, active section, buttons). It is nudged
  // per surface so it stays readable: the page follows light/dark, the lightbox is always dark.
  const brand = g.studio.brandColor
  // Checked against the lightest Darkroom surface (overlay), so it reads on the page, cards, menus and lightbox.
  const accent = useMemo(() => brandAccentStyle(brand, ACCENT_SURFACES.darkroomOverlay), [brand])

  const visible = useMemo(
    () => (view === "all" ? g.all : g.all.filter((p) => favs.has(p.id))),
    [g.all, view, favs]
  )

  const sections = useMemo(
    () =>
      g.sections
        .map((s) => ({ ...s, photos: s.photos.filter((p) => view === "all" || favs.has(p.id)) }))
        .filter((s) => s.photos.length > 0),
    [g.sections, view, favs]
  )

  // Track which event is on screen for the section bar.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-gallery-section]")
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const download = onDownload

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: "Link copied", body: "It previews with the cover and your names.", tone: "success" })
    } catch {
      toast({ title: "Copy the address bar to share this gallery" })
    }
  }

  const downloadAll = () =>
    toast({
      title: "Preparing your ZIP",
      body: view === "favourites" ? `${favs.size} favourites. We'll email the link.` : `All ${g.all.length} photos. We'll email the link when it's ready.`,
    })

  return (
    <div className="min-h-dvh" style={accent}>
      <SkipLink href="#photos">Skip to photos</SkipLink>
      <Cover data={g} sample={sample} onShare={share} favCount={favs.size} onShowFavs={() => setView("favourites")} />

      {/* Section bar */}
      <div className="sticky top-0 z-(--z-sticky) border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-2 sm:px-4">
          <nav aria-label="Events" className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={cn(
                  "relative flex h-12 shrink-0 items-center px-3 type-caption transition-colors",
                  active === s.id ? "text-ink" : "text-ink-muted hover:text-ink"
                )}
              >
                {s.name}
                {active === s.id && (
                  <motion.span layoutId="section-active" className="absolute inset-x-3 bottom-0 h-0.5 bg-safelight" transition={{ type: "spring", stiffness: 400, damping: 36 }} />
                )}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 border-l border-line pl-2">
            <button
              type="button"
              onClick={() => setView((v) => (v === "all" ? "favourites" : "all"))}
              aria-pressed={view === "favourites"}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full px-3 type-caption transition-colors",
                view === "favourites" ? "bg-safelight-soft text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              <Icon name="heart" className="size-4" fill={view === "favourites" ? "var(--safelight)" : "none"} />
              <span className="hidden sm:inline">Favourites</span>
              <motion.span key={favs.size} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="type-metric text-caption">
                {favs.size}
              </motion.span>
            </button>
            {sample && (
            <button
              type="button"
              onClick={downloadAll}
              className="flex h-11 items-center gap-2 rounded-full px-3 type-caption text-ink-muted transition-colors hover:text-ink"
            >
              <Icon name="download" className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <main id="photos" className="mx-auto max-w-[1600px] px-2 pt-6 pb-24 sm:px-4">
        <AnimatePresence mode="popLayout">
          {sections.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-sm py-24 text-center"
            >
              <p className="type-heading-2">No favourites yet</p>
              <p className="mt-2 text-ink-muted">Tap the heart on any photo to keep it here.</p>
              <button type="button" onClick={() => setView("all")} className="mt-6 h-11 rounded-[var(--radius-control)] border border-line-strong px-5 type-caption hover:border-ink">
                Back to all photos
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {sections.map((s) => (
          <section key={s.id} id={s.id} data-gallery-section aria-labelledby={`${s.id}-title`} className="scroll-mt-16 pt-10 first:pt-4">
            <div className="mb-4 flex items-baseline justify-between gap-4 px-1">
              <h2 id={`${s.id}-title`} className="type-heading-1">{s.name}</h2>
              <p className="type-label text-ink-muted">
                {s.day ? `${s.day} · ` : ""}{s.photos.length} {s.photos.length === 1 ? "photo" : "photos"}
              </p>
            </div>
            <div className="columns-2 gap-2 md:columns-3 xl:columns-4">
              {s.photos.map((p) => {
                const i = visible.findIndex((v) => v.id === p.id)
                return (
                  <Tile
                    key={p.id}
                    photo={p}
                    fav={has(p.id)}
                    onFav={() => {
                      toggle(p.id)
                    }}
                    onOpen={() => setLightbox(i)}
                    onDownload={() => download(p)}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 px-4 py-10 text-center">
          <p className="font-heading text-body font-bold tracking-[0.25em] uppercase">{g.studio.name}</p>
          {g.studio.email && (
            <a href={`mailto:${g.studio.email}`} className="type-caption text-ink-muted underline-offset-4 hover:underline">
              {g.studio.email}
            </a>
          )}
          <p className="mt-6 type-label text-ink-muted">Delivered with Framesly</p>
        </div>
      </footer>

      <Lightbox
        items={visible}
        index={lightbox}
        onIndex={setLightbox}
        onClose={() => setLightbox(null)}
        isFav={has}
        toggleFav={toggle}
        onDownload={download}
        accentStyle={accent}
      />

      {sample && <SampleNotice />}
    </div>
  )
}

function Cover({ data: g, sample, onShare, favCount, onShowFavs }: { data: GalleryViewData; sample: boolean; onShare: () => void; favCount: number; onShowFavs: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <header ref={ref} className="relative h-[88svh] min-h-[520px] overflow-hidden bg-surface-sunken">
      <motion.div style={{ y }} className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: develop }}>
        {g.cover && <Image src={g.cover.src} alt={g.cover.alt} fill priority sizes="100vw" quality={85} className="object-cover object-[50%_35%]" />}
      </motion.div>
      {/* Scrim so the names stay readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.82)] via-[rgb(var(--scrim)/0.18)] to-[rgb(var(--scrim)/0.45)]" />

      {/* Photographer's logo top-left, never Framesly's */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 text-white sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <StudioLogo
            name={g.studio.name}
            logoUrl={g.studio.logoUrl}
            imageClassName="max-h-10 max-w-[160px] drop-shadow"
            textClassName="text-small tracking-[0.3em] sm:text-body"
          />
          {sample && <span className="rounded-full bg-white/85 px-2 py-0.5 type-label text-fixed-dark">Sample</span>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onShowFavs} className="flex h-11 items-center gap-2 rounded-full px-3 type-caption text-white/90 transition-colors hover:bg-white/10">
            <Icon name="heart" className="size-4" />
            <span className="type-metric text-caption">{favCount}</span>
          </button>
          <button type="button" onClick={onShare} className="flex h-11 items-center gap-2 rounded-full px-3 type-caption text-white/90 transition-colors hover:bg-white/10">
            <Icon name="share" className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-0 px-4 pb-10 text-white sm:px-8 sm:pb-14">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: develop }} className="type-label text-white/75">
          {g.subtitle}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 1, ease: develop }}
          className="mt-3 font-heading text-[56px] leading-[0.95] font-bold tracking-[-0.035em] sm:text-[96px] lg:text-[128px]"
        >
          {g.couple}
        </motion.h1>
        <motion.a
          href="#photos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 inline-flex h-11 items-center gap-3 rounded-full border border-white/40 px-5 type-caption text-white transition-colors hover:bg-white hover:text-fixed-dark"
        >
          View the photos
          <motion.svg viewBox="0 0 20 20" className="size-4" animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} aria-hidden>
            <path d="M10 4v12m0 0-4.5-4.5M10 16l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.a>
      </motion.div>
    </header>
  )
}

/** One photo in the masonry grid, with two controls: favourite and download. */
function Tile({
  photo,
  fav,
  onFav,
  onOpen,
  onDownload,
}: {
  photo: GalleryPhoto
  fav: boolean
  onFav: () => void
  onOpen: () => void
  onDownload: () => void
}) {
  // A pulsing block sits under the photo until it has loaded, so slow connections never see empty holes.
  const [loaded, setLoaded] = useState(false)
  return (
    <motion.figure
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: develop }}
      className={cn("group relative mb-2 break-inside-avoid overflow-hidden bg-surface-sunken", fav && "selected-frame")}
    >
      <button type="button" onClick={onOpen} aria-label={`Open ${photo.alt}`} className="block w-full cursor-zoom-in">
        <motion.div layoutId={`photo-${photo.id}`} className="relative" style={{ aspectRatio: `${photo.w} / ${photo.h}` }}>
          {!loaded && <span aria-hidden className="absolute inset-0 animate-pulse bg-surface-raised" />}
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            onLoad={() => setLoaded(true)}
            className="object-cover transition-[scale] duration-700 ease-[var(--ease-develop)] group-hover:scale-[1.03]"
          />
        </motion.div>
      </button>
      <div
        className={cn(
          // Click-through bar: only the buttons take taps, so short tiles still open on tap.
          // On touch screens the heart is the only control here; download lives in the viewer.
          "pointer-events-none absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-[rgb(var(--scrim)/0.55)] to-transparent p-1.5 pt-6 text-white transition-opacity duration-300 [&>*]:pointer-events-auto",
          "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
          fav && "opacity-100"
        )}
      >
        <HeartButton on={fav} onToggle={onFav} label={fav ? "Remove from favourites" : "Add to favourites"} className="hover:bg-white/15" />
        <motion.button
          type="button"
          whileTap={{ scale: 0.86 }}
          onClick={onDownload}
          aria-label="Download photo"
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/15 [@media(hover:none)]:hidden"
        >
          <Icon name="download" className="size-5" />
        </motion.button>
      </div>
    </motion.figure>
  )
}

/** Sample-only bar that leads visitors back to sign-up. */
function SampleNotice() {
  const [hidden, setHidden] = useState(false)
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 1.6, duration: 0.5, ease: develop } }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-1/2 z-(--z-nav) flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-surface-overlay py-1.5 pr-1.5 pl-4 text-ink shadow-float"
        >
          <p className="flex-1 truncate type-caption text-ink-muted">
            <span className="text-ink">Sample gallery.</span> Yours looks like this.
          </p>
          <Link href="/signup" className="flex h-11 items-center rounded-full bg-safelight px-4 type-caption text-on-safelight">
            Start free
          </Link>
          <button type="button" aria-label="Hide" onClick={() => setHidden(true)} className="grid size-11 place-items-center rounded-full text-ink-muted hover:text-ink">
            <Icon name="close" className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
