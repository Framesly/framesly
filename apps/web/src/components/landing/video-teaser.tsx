"use client"

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useRef, useMemo } from "react"

import { RevealText } from "@/components/motion/reveal"
import { TextLink } from "@/components/ui/button"
import { EdgeLabel } from "@/components/ui/card"
import { useSitePhotos } from "@/components/site/site-photos"
import { type SitePhotos } from "@/lib/photos"

const buildReel = (photos: SitePhotos) => [
  { p: photos.brickArches, t: "00:12", label: "Arrival" },
  { p: photos.tentDance, t: "01:48", label: "Sangeet" },
  { p: photos.hallEntrance, t: "03:10", label: "Anand Karaj" },
  { p: photos.mandapCouple, t: "04:05", label: "Mandap" },
  { p: photos.brideDance, t: "06:02", label: "Bride’s dance" },
  { p: photos.champagne, t: "07:22", label: "Toasts" },
  { p: photos.receptionStage, t: "09:14", label: "Reception" },
  { p: photos.duskShore, t: "10:02", label: "Send-off" },
]

/** A film strip that slides sideways as the page scrolls down. */
export function VideoTeaser({ showLink = true }: { showLink?: boolean }) {
  const photos = useSitePhotos()
  const reel = useMemo(() => buildReel(photos), [photos])
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-38%"])

  return (
    <section ref={ref} aria-labelledby="video-title" className="grain overflow-hidden border-t border-line py-24 md:py-32">
      <div className="gutter mx-auto grid max-w-[var(--container-content)] gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <EdgeLabel>For videographers · after the beta</EdgeLabel>
          <RevealText as="h2" text="Films next to the photos." className="mt-4 type-heading-1 md:type-display-l" />
        </div>
        <div className="md:col-span-5">
          <p className="max-w-md type-body-l text-ink-muted">
            Teaser, highlight and full film in the same gallery as the photos, with comments pinned
            to the exact second.
          </p>
          {showLink && (
            <TextLink href="/video" className="mt-4">
              What&apos;s coming
            </TextLink>
          )}
        </div>
      </div>

      <div className="mt-16 border-y border-line bg-surface-sunken py-3">
        <Sprockets />
        <motion.ol style={{ x }} className="flex gap-3 py-3 pl-4 will-change-transform">
          {reel.map((r) => (
            <li key={r.t} className="relative w-[260px] shrink-0 sm:w-[340px]">
              <div className="relative aspect-video overflow-hidden">
                <Image src={r.p.src} alt={`Film chapter at ${r.t}: ${r.label}. ${r.p.alt}`} fill sizes="340px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.7)] to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-[var(--radius-chip)] bg-[rgb(var(--scrim)/0.7)] px-2 py-0.5 type-metric text-micro text-fixed-light">
                  {r.t}
                </span>
              </div>
              <p className="mt-2 type-label text-ink-muted">{r.label}</p>
            </li>
          ))}
        </motion.ol>
        <Sprockets />
      </div>
    </section>
  )
}

function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-2.5"
      style={{
        backgroundImage: "radial-gradient(circle at center, var(--surface) 0 3px, transparent 3.5px)",
        backgroundSize: "18px 10px",
        backgroundRepeat: "repeat-x",
        opacity: 0.9,
      }}
    />
  )
}
