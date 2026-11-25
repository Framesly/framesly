"use client"

import { AnimatePresence, motion, type PanInfo } from "motion/react"
import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type TouchEvent } from "react"

import { HeartButton } from "@/components/gallery/heart-button"
import type { GalleryPhoto } from "@/components/gallery/gallery-data"
import { useFocusTrap } from "@/components/ui/use-focus-trap"
import { cn, frameNo } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

const develop = [0.22, 1, 0.36, 1] as const

const MAX_ZOOM = 4
const SLIDE_MS = 4000
const DOUBLE_TAP_ZOOM = 2.5
const ZOOM_STEP = 1.5
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(1, z))

function IconButton({ label, onClick, disabled, pressed, children }: { label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-overlay disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </motion.button>
  )
}

/**
 * Full-screen viewer on the sunken Darkroom surface. The opened photo grows
 * out of its grid tile via a shared layout animation. Arrow keys and swipes move between photos; Esc closes.
 * Zoom: double-tap or double-click, pinch, the +/- buttons, or the + - 0 keys. A play button runs a slideshow.
 * While zoomed, the photo scrolls to pan and arrow keys pan instead of changing photo.
 * Tab stays inside the viewer until it closes.
 */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  isFav,
  toggleFav,
  onDownload,
  accentStyle,
}: {
  items: GalleryPhoto[]
  index: number | null
  onIndex: (i: number) => void
  onClose: () => void
  isFav: (id: string) => boolean
  toggleFav: (id: string) => void
  onDownload: (p: GalleryPhoto) => void
  /** The studio's accent as CSS variables, readable on this dark surface. */
  accentStyle?: CSSProperties
}) {
  const open = index !== null
  const photo = open ? items[index] : null
  const [dir, setDir] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Only the photo that was clicked grows out of its tile; the rest slide.
  const [originId, setOriginId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    setOriginId(index !== null ? (items[index]?.id ?? null) : null)
    if (open) setDir(0)
    else setPlaying(false)
  }

  // Zoom belongs to one photo: moving to another starts at 1x again.
  const [zoomState, setZoomState] = useState<{ id: string | null; level: number }>({ id: null, level: 1 })
  const level = photo && zoomState.id === photo.id ? zoomState.level : 1
  const zoomed = level > 1
  const scrollRef = useRef<HTMLDivElement>(null)
  // Where to keep under the finger or cursor when the zoom level changes.
  const anchor = useRef<{ fx: number; fy: number; px: number; py: number } | null>(null)

  const setLevel = (next: number) => {
    if (photo) setZoomState({ id: photo.id, level: clampZoom(next) })
  }
  /** Remember which point of the photo sits under (clientX, clientY), so zooming keeps it there. */
  const anchorAt = (clientX: number, clientY: number) => {
    const el = scrollRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = clientX - r.left
    const py = clientY - r.top
    anchor.current = { fx: (el.scrollLeft + px) / el.scrollWidth, fy: (el.scrollTop + py) / el.scrollHeight, px, py }
  }
  const zoomFromCentre = (factor: number) => {
    const r = scrollRef.current?.getBoundingClientRect()
    if (r) anchorAt(r.left + r.width / 2, r.top + r.height / 2)
    setLevel(level * factor)
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    const a = anchor.current
    if (!el || !a) return
    el.scrollLeft = a.fx * el.scrollWidth - a.px
    el.scrollTop = a.fy * el.scrollHeight - a.py
    anchor.current = null
  }, [level])

  const go = (d: number) => {
    if (index === null) return
    const n = (index + d + items.length) % items.length
    setDir(d)
    onIndex(n)
  }

  useFocusTrap(panelRef, open)

  // Slideshow: advance every few seconds. It pauses while zoomed and restarts its timer after any manual move.
  useEffect(() => {
    if (!open || !playing || zoomed) return
    const t = setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
    // `go` only reads the current index, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playing, zoomed, index])

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "+" || e.key === "=") zoomFromCentre(ZOOM_STEP)
      else if (e.key === "-") zoomFromCentre(1 / ZOOM_STEP)
      else if (e.key === "0") setLevel(1)
      else if (e.key.startsWith("Arrow")) {
        if (zoomed) {
          // Pan the zoomed photo instead of changing photo.
          const step = 120
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
          scrollRef.current?.scrollBy({ left: dx, top: dy })
          e.preventDefault()
        } else if (e.key === "ArrowRight") go(1)
        else if (e.key === "ArrowLeft") go(-1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = ""
      prevFocus?.focus()
    }
    // Re-run only when the viewer opens, moves or zooms; the handlers read the latest props via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, level])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 80 || info.velocity.x > 400) go(-1)
  }

  // Double-tap (touch) and double-click (mouse) toggle zoom; both arrive as pointer events.
  const tap = useRef({ downX: 0, downY: 0, t: 0, x: 0, y: 0 })
  const onPointerDown = (e: PointerEvent) => {
    tap.current.downX = e.clientX
    tap.current.downY = e.clientY
  }
  const onPointerUp = (e: PointerEvent) => {
    const t = tap.current
    if (Math.hypot(e.clientX - t.downX, e.clientY - t.downY) > 10) return // a drag or pan, not a tap
    if (e.timeStamp - t.t < 300 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 30) {
      t.t = 0
      if (zoomed) setLevel(1)
      else {
        anchorAt(e.clientX, e.clientY)
        setLevel(DOUBLE_TAP_ZOOM)
      }
    } else {
      t.t = e.timeStamp
      t.x = e.clientX
      t.y = e.clientY
    }
  }

  // Pinch with two fingers.
  const pinch = useRef<{ dist: number; level: number } | null>(null)
  const touchDist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) pinch.current = { dist: touchDist(e), level }
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!pinch.current || e.touches.length !== 2) return
    anchorAt((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2)
    setLevel(pinch.current.level * (touchDist(e) / pinch.current.dist))
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null
  }

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index! + 1} of ${items.length}`}
          className="fixed inset-0 z-(--z-viewer) flex flex-col bg-surface-sunken text-ink"
          style={accentStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
            <p className="type-metric text-ink-muted">
              <span className="text-ink">{String(index! + 1).padStart(2, "0")}</span> / {items.length}
              <span className="ml-3 hidden type-label sm:inline">Frame {frameNo(photo.frame)}</span>
              {zoomed && <span className="ml-3 type-label">{Math.round(level * 100)}%</span>}
            </p>
            <div className="flex items-center gap-1">
              <IconButton label={playing ? "Pause slideshow" : "Play slideshow"} pressed={playing} onClick={() => setPlaying((p) => !p)}>
                <Icon name={playing ? "pause" : "play"} />
              </IconButton>
              <IconButton label="Zoom out" disabled={!zoomed} onClick={() => zoomFromCentre(1 / ZOOM_STEP)}>
                <Icon name="zoom-out" />
              </IconButton>
              <IconButton label="Zoom in" disabled={level >= MAX_ZOOM} onClick={() => zoomFromCentre(ZOOM_STEP)}>
                <Icon name="zoom-in" />
              </IconButton>
              <HeartButton
                on={isFav(photo.id)}
                onToggle={() => toggleFav(photo.id)}
                label={isFav(photo.id) ? "Remove from favourites" : "Add to favourites"}
                className="text-ink hover:bg-surface-overlay"
              />
              <IconButton label="Download photo" onClick={() => onDownload(photo)}>
                <Icon name="download" className="size-5" />
              </IconButton>
              <motion.button
                ref={closeRef}
                type="button"
                aria-label="Close"
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-overlay"
              >
                <Icon name="close" className="size-5" />
              </motion.button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-16">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={photo.id}
                layoutId={photo.id === originId ? `photo-${photo.id}` : undefined}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ x: d === 0 ? 0 : d > 0 ? "30%" : "-30%", opacity: d === 0 ? 1 : 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d > 0 ? "-30%" : "30%", opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: develop }}
                // Swiping changes photo only at 1x; zoomed, the photo scrolls instead.
                drag={zoomed ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                className="relative h-full max-h-[calc(100dvh-88px)] w-full"
              >
                <div
                  ref={scrollRef}
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  className={cn("h-full w-full", zoomed ? "touch-pan-x touch-pan-y overflow-auto" : "cursor-zoom-in touch-pan-y overflow-hidden")}
                >
                  <div className="relative" style={{ width: `${level * 100}%`, height: `${level * 100}%` }}>
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes={zoomed ? "300vw" : "100vw"}
                      quality={85}
                      className="pointer-events-none object-contain"
                      priority
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-2 top-1/2 hidden -translate-y-1/2 justify-between sm:flex">
              <div className="pointer-events-auto">
                <IconButton label="Previous photo" onClick={() => go(-1)}>
                  <Icon name="chevron-left" className="size-5" />
                </IconButton>
              </div>
              <div className="pointer-events-auto">
                <IconButton label="Next photo" onClick={() => go(1)}>
                  <Icon name="chevron-right" className="size-5" />
                </IconButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
