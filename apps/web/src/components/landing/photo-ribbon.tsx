"use client"

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useMemo } from "react"

import { RevealText } from "@/components/motion/reveal"
import { EdgeLabel } from "@/components/ui/card"
import { useSitePhotos } from "@/components/site/site-photos"
import { type SitePhotos, type Photo } from "@/lib/photos"
import { frameNo } from "@/lib/utils"

type Item = { photo: Photo; label: string; frame: number }

const buildRowA = (photos: SitePhotos): Item[] => [
  { photo: photos.bridalLaugh, label: "Getting ready", frame: 112 },
  { photo: photos.hallEntrance, label: "Anand Karaj", frame: 1204 },
  { photo: photos.tentDance, label: "Sangeet", frame: 604 },
  { photo: photos.emeraldAttire, label: "Engagement", frame: 318 },
  { photo: photos.mandapCouple, label: "Mandap", frame: 1288 },
  { photo: photos.jointLaugh, label: "Candids", frame: 742 },
  { photo: photos.baraat, label: "Baraat", frame: 1530 },
  { photo: photos.nikahCouple, label: "Nikah", frame: 1366 },
]
const buildRowB = (photos: SitePhotos): Item[] => [
  { photo: photos.receptionStage, label: "Reception", frame: 2101 },
  { photo: photos.hennaHands, label: "Mehendi", frame: 287 },
  { photo: photos.ceremonyBow, label: "Vows", frame: 1250 },
  { photo: photos.shawlCanopy, label: "Couple shoot", frame: 980 },
  { photo: photos.lakeDance, label: "First dance", frame: 1873 },
  { photo: photos.redDressKiss, label: "Pre-wedding", frame: 64 },
  { photo: photos.marigoldMandap, label: "Ceremony", frame: 911 },
  { photo: photos.duskShore, label: "Send-off", frame: 2140 },
]

/**
 * Two rows of photos drifting in opposite directions. Scrolling speeds them
 * up in the direction you scroll, then they ease back to a gentle drift.
 * Each frame is a single transform on one element per row; rows stop
 * updating when off screen.
 */
function Row({ items, baseSpeed, height }: { items: Item[]; baseSpeed: number; height: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "200px 0px" })
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const half = useRef(0)

  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [-2000, 0, 2000], [-5, 0, 5], { clamp: false })
  const direction = useRef(1)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      half.current = el.scrollWidth / 2
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useAnimationFrame((_, delta) => {
    if (!inView || reduce || !half.current) return
    const b = boost.get()
    if (b < -0.05) direction.current = -1
    else if (b > 0.05) direction.current = 1
    const speed = baseSpeed * direction.current * (1 + Math.abs(b))
    let next = x.get() - speed * (delta / 1000)
    if (next <= -half.current) next += half.current
    if (next > 0) next -= half.current
    x.set(next)
  })

  const doubled = [...items, ...items]
  return (
    <div ref={ref} className="overflow-hidden [contain:paint]">
      <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-4 will-change-transform sm:gap-5">
        {doubled.map((it, i) => {
          const w = Math.round((it.photo.w / it.photo.h) * 100)
          return (
            <figure key={i} className="group shrink-0" aria-hidden={i >= items.length}>
              <div className={`print relative ${height}`} style={{ aspectRatio: `${w} / 100` }}>
                <div className="relative size-full overflow-hidden">
                  <Image
                    src={it.photo.src}
                    alt={i < items.length ? it.photo.alt : ""}
                    fill
                    sizes="320px"
                    className="object-cover transition-[scale] duration-700 ease-[var(--ease-develop)] group-hover:scale-105"
                  />
                </div>
              </div>
              <figcaption className="mt-2 flex justify-between gap-3 type-label text-ink-muted">
                <span>{it.label}</span>
                <span>{frameNo(it.frame)}</span>
              </figcaption>
            </figure>
          )
        })}
      </motion.div>
    </div>
  )
}

export function PhotoRibbon() {
  const photos = useSitePhotos()
  const rowA = useMemo(() => buildRowA(photos), [photos])
  const rowB = useMemo(() => buildRowB(photos), [photos])
  return (
    <section aria-labelledby="ribbon-title" className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-16">
      <div className="gutter mx-auto max-w-[var(--container-content)]">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <EdgeLabel tone="safelight">Every frame, every shooter, every day</EdgeLabel>
            <RevealText
              as="h2"
              text="Haldi to send-off. One upload."
              className="mt-4 type-heading-1 text-balance md:type-display-l"
            />
          </div>
          <p className="max-w-md type-body-l text-ink-muted md:col-span-5">
            A wedding is 2,000 to 15,000 frames from several cameras over several days. Framesly keeps
            them in one place, in shooting order, from the first upload.
          </p>
        </div>
      </div>

      <div className="mt-14 space-y-6">
        <Row items={rowA} baseSpeed={28} height="h-[150px] sm:h-[220px]" />
        <Row items={rowB} baseSpeed={-22} height="h-[120px] sm:h-[170px]" />
      </div>
    </section>
  )
}
