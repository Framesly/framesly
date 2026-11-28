"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"

import { useSitePhotos } from "@/components/site/site-photos"
import { type SitePhotos } from "@/lib/photos"
import { cn, frameNo } from "@/lib/utils"

const buildSlides = (photos: SitePhotos) => [
  { photo: photos.forestPortrait, frame: 412, verdict: "Pick", note: "Sharp · eyes open · best of burst", position: "50% 40%" },
  { photo: photos.bridalPose, frame: 414, verdict: "Pick", note: "Strongest expression in a 7-frame burst", position: "50% 30%" },
  { photo: photos.lakeDeck, frame: 410, verdict: "Pick", note: "Kept over 3 near-duplicates", position: "50% 50%" },
  { photo: photos.whiteDressSmile, frame: 416, verdict: "Pick", note: "Sharp · eyes open · no motion blur", position: "50% 25%" },
]

const develop = [0.22, 1, 0.36, 1] as const
const INTERVAL = 4200

/** Viewfinder brackets that "find focus": they start wide and snap in. */
function FocusBrackets({ k, reduce }: { k: number; reduce: boolean }) {
  const corners = [
    "top-0 left-0 border-t-2 border-l-2",
    "top-0 right-0 border-t-2 border-r-2",
    "bottom-0 left-0 border-b-2 border-l-2",
    "right-0 bottom-0 border-r-2 border-b-2",
  ]
  const out = [
    { x: -18, y: -18 },
    { x: 18, y: -18 },
    { x: -18, y: 18 },
    { x: 18, y: 18 },
  ]
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {corners.map((c, i) => (
        <motion.span
          key={`${k}-${i}`}
          className={cn("absolute size-8 border-safelight", c)}
          initial={reduce ? false : { ...out[i], opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: develop, delay: 0.25 }}
        />
      ))}
    </span>
  )
}

/**
 * Right-hand panel of the auth pages: a slow slideshow of culled picks.
 * Each slide pushes in slowly, the viewfinder snaps into focus, and the
 * caption reports why the AI kept the frame.
 */
export function AuthShowcase() {
  const photos = useSitePhotos()
  const slides = useMemo(() => buildSlides(photos), [photos])
  const reduce = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL)
    return () => clearInterval(t)
  }, [reduce, slides.length])

  const slide = slides[index]

  return (
    <div className="relative h-full">
      <div className="absolute inset-6 overflow-hidden rounded-[var(--radius-cover)] bg-surface-sunken">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1, ease: "easeInOut" }, scale: { duration: INTERVAL / 1000 + 1.2, ease: "linear" } }}
          >
            <Image
              src={slide.photo.src}
              alt={slide.photo.alt}
              fill
              priority={index === 0}
              sizes="50vw"
              quality={85}
              className="object-cover"
              style={{ objectPosition: slide.position }}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.75)] via-transparent to-[rgb(var(--scrim)/0.2)]" />
      </div>

      <FocusBrackets k={index} reduce={reduce} />

      {/* Live readout */}
      <div className="absolute top-10 left-10 flex items-center gap-2 rounded-full bg-[rgb(var(--scrim)/0.6)] px-3 py-1.5">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-safelight" />
          <span className="relative size-1.5 rounded-full bg-safelight" />
        </span>
        <span className="type-label text-fixed-light">Sample cull · Wow Films</span>
      </div>

      <div className="absolute right-10 bottom-10 left-10 text-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: develop }}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-[var(--radius-chip)] bg-safelight px-2 py-0.5 type-label text-on-safelight">{slide.verdict}</span>
              <span className="type-label text-white/80">Frame {frameNo(slide.frame)}</span>
            </div>
            <p className="mt-3 max-w-sm font-heading text-[26px] leading-8 font-bold tracking-[-0.02em] [text-shadow:0_2px_24px_rgb(0_0_0/0.45)]">
              {slide.note}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress ticks */}
        <div className="mt-6 flex gap-2">
          {slides.map((_, i) => (
            <span key={i} className="relative h-0.5 flex-1 overflow-hidden bg-white/25">
              {i === index && !reduce && (
                <motion.span
                  className="absolute inset-0 origin-left bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                />
              )}
              {(i < index || (reduce && i === index)) && <span className="absolute inset-0 bg-white/70" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Compact version for phones: a short banner above the form. */
export function AuthBanner() {
  const photos = useSitePhotos()
  const slides = useMemo(() => buildSlides(photos), [photos])
  const reduce = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL)
    return () => clearInterval(t)
  }, [reduce, slides.length])
  const slide = slides[index]
  return (
    <div className="relative h-36 overflow-hidden rounded-[var(--radius-cover)] bg-surface-sunken">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1 }, scale: { duration: INTERVAL / 1000 + 1, ease: "linear" } }}
        >
          <Image src={slide.photo.src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: slide.position }} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.6)] to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-[var(--radius-chip)] bg-safelight px-2 py-0.5 type-label text-on-safelight">
        Pick · {frameNo(slide.frame)}
      </span>
    </div>
  )
}
