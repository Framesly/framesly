"use client"

import { AnimatePresence, motion, type PanInfo } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { HeartButton } from "@/components/gallery/heart-button"
import type { GalleryPhoto } from "@/components/gallery/gallery-data"
import { frameNo } from "@/lib/utils"

const develop = [0.22, 1, 0.36, 1] as const

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-raised"
    >
      {children}
    </motion.button>
  )
}

/**
 * Full-screen viewer on the sunken Darkroom surface. The opened photo grows
 * out of its grid tile via a shared layout animation. Arrow keys and swipes move between photos; Esc closes.
 */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  isFav,
  toggleFav,
  onDownload,
}: {
  items: GalleryPhoto[]
  index: number | null
  onIndex: (i: number) => void
  onClose: () => void
  isFav: (id: string) => boolean
  toggleFav: (id: string) => void
  onDownload: (p: GalleryPhoto) => void
}) {
  const open = index !== null
  const photo = open ? items[index] : null
  const [dir, setDir] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  // Only the photo that was clicked grows out of its tile; the rest slide.
  const [originId, setOriginId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    setOriginId(index !== null ? (items[index]?.id ?? null) : null)
    if (open) setDir(0)
  }

  const go = (d: number) => {
    if (index === null) return
    const n = (index + d + items.length) % items.length
    setDir(d)
    onIndex(n)
  }

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = ""
      prevFocus?.focus()
    }
    // Re-run only when the viewer opens or moves; the handlers read the latest props via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 80 || info.velocity.x > 400) go(-1)
  }

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index! + 1} of ${items.length}`}
          className="theme-darkroom fixed inset-0 z-[70] flex flex-col bg-surface-sunken"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
            <p className="type-metric text-ink-muted">
              <span className="text-ink">{String(index! + 1).padStart(2, "0")}</span> / {items.length}
              <span className="ml-3 hidden type-label sm:inline">Frame {frameNo(photo.frame)}</span>
            </p>
            <div className="flex items-center gap-1">
              <HeartButton
                on={isFav(photo.id)}
                onToggle={() => toggleFav(photo.id)}
                label={isFav(photo.id) ? "Remove from favourites" : "Add to favourites"}
                className="text-ink hover:bg-surface-raised"
              />
              <IconButton label="Download photo" onClick={() => onDownload(photo)}>
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </IconButton>
              <motion.button
                ref={closeRef}
                type="button"
                aria-label="Close"
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-raised"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
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
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                className="relative h-full max-h-[calc(100dvh-88px)] w-full cursor-grab touch-pan-y active:cursor-grabbing"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  quality={85}
                  className="pointer-events-none object-contain"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-2 top-1/2 hidden -translate-y-1/2 justify-between sm:flex">
              <div className="pointer-events-auto">
                <IconButton label="Previous photo" onClick={() => go(-1)}>
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconButton>
              </div>
              <div className="pointer-events-auto">
                <IconButton label="Next photo" onClick={() => go(1)}>
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
