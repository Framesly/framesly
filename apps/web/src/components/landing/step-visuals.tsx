"use client"

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState, useMemo } from "react"

import { Chip } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"
import { useSitePhotos } from "@/components/site/site-photos"
import { type SitePhotos } from "@/lib/photos"
import { cn } from "@/lib/utils"

const develop = [0.22, 1, 0.36, 1] as const

function Panel({ title, meta, children, className }: { title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-cover)] border border-line bg-surface-raised", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="type-label text-ink-muted">{title}</p>
        {meta}
      </div>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 01 Upload                                                                   */
/* -------------------------------------------------------------------------- */

const files = [
  { name: "DSC_0408.JPG", size: "22.4 MB", d: 1.6 },
  { name: "DSC_0409.JPG", size: "23.1 MB", d: 2.2 },
  { name: "DSC_0410.JPG", size: "21.8 MB", d: 1.9, dropped: true },
  { name: "DSC_0411.JPG", size: "24.0 MB", d: 2.6 },
  { name: "DSC_0412.JPG", size: "22.9 MB", d: 2.0 },
]

export function UploadVisual() {
  // Looping bars are CSS transforms (compositor only) and pause off screen.
  // They used to animate `width`, which forced layout every frame.
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "100px 0px" })
  const reduce = useReducedMotion()
  return (
    <div ref={ref} data-offscreen={!inView}>
      <Panel
        title="Uploading · Day 2"
        meta={<span className="type-metric text-ink">1,402<span className="text-ink-muted"> / 2,184</span></span>}
      >
        <ul className="divide-y divide-line">
          {files.map((f, i) => (
            <li key={f.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="type-metric text-ink">{f.name}</span>
              <span className="type-label text-ink-muted">{f.size}</span>
              <div className="col-span-2 h-1 overflow-hidden bg-surface-sunken">
                <div
                  className={cn("h-full origin-left", f.dropped ? "bg-safelight" : "bg-ink-muted")}
                  style={{
                    animation: `${f.dropped ? "upload-drop 4.8s" : `upload-fill ${(f.d + 1.2).toFixed(1)}s`} ease-in-out ${i * 0.15}s infinite both`,
                  }}
                />
              </div>
              {f.dropped && <DropStatus delayMs={i * 150} active={inView && !reduce} />}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-sunken px-4 py-3">
          <p className="type-caption text-ink-muted">Straight to storage. Resumes after a dropped connection.</p>
        </div>
      </Panel>
    </div>
  )
}

/** Status line synced to the dropped file's 4.8s loop (3.6s run + 1.2s pause). */
const dropStates = [
  { at: 0, label: "Uploading", tone: "text-ink-muted" },
  { at: 1300, label: "Connection dropped · waiting", tone: "text-danger" },
  { at: 2200, label: "Resumed from part 7 of 12", tone: "text-success" },
  { at: 3700, label: "Uploaded", tone: "text-success" },
] as const

function DropStatus({ delayMs, active }: { delayMs: number; active: boolean }) {
  const [state, setState] = useState(0)
  useEffect(() => {
    if (!active) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const cycle = () => {
      dropStates.forEach((s, i) => timers.push(setTimeout(() => setState(i), s.at)))
    }
    const start = setTimeout(() => {
      cycle()
      const loop = setInterval(cycle, 4800)
      timers.push(loop as unknown as ReturnType<typeof setTimeout>)
    }, delayMs)
    return () => {
      clearTimeout(start)
      timers.forEach((t) => {
        clearTimeout(t)
        clearInterval(t)
      })
    }
  }, [delayMs, active])
  const s = dropStates[state]
  return (
    <p className={cn("col-span-2 type-label transition-colors", s.tone)} aria-live="off">
      {s.label}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/* 02 Cull to N                                                                */
/* -------------------------------------------------------------------------- */

const buildThumbs = (photos: SitePhotos) => [
  photos.bridalLaugh, photos.mandapCouple, photos.beachTwirl, photos.hennaHands, photos.forestPortrait, photos.pujaRitual,
  photos.bridalMirror, photos.ringHands, photos.gardenProcession, photos.anandKaraj, photos.gardenArch, photos.bridalPortrait,
  photos.afghanLaugh, photos.pathTogether, photos.avenueWalk, photos.dupattaDance, photos.sunglassesDance, photos.lakeDance,
]

export function CullVisual() {
  const photos = useSitePhotos()
  const thumbs = useMemo(() => buildThumbs(photos), [photos])
  // The same example wedding as the rest of the page: 2,184 frames, 612 picks, 41 minutes.
  const [n, setN] = useState(612)
  const total = 2184
  const picksShown = Math.round((n / total) * thumbs.length * 1.9)
  const step = (d: number) => setN((v) => Math.min(1200, Math.max(200, v + d)))

  return (
    <Panel title="Cull to N" meta={<Chip tone="pick">AI picks</Chip>}>
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="type-caption text-ink-muted">Deliver</p>
          <div className="relative h-[44px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={n}
                className="font-heading text-[40px] leading-[44px] font-bold tracking-[-0.03em] tabular-nums"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.35, ease: develop }}
              >
                {n}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="type-caption text-ink-muted">of {total.toLocaleString("en-US")} photos</p>
        </div>
        <div className="flex gap-2">
          {[
            [-100, "Fewer"],
            [100, "More"],
          ].map(([d, label]) => (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => step(d as number)}
              aria-label={`${label} photos`}
              className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-line-strong text-ink transition-colors hover:border-ink hover:bg-surface-sunken"
            >
              <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                <path d={d === -100 ? "M5 10h10" : "M5 10h10M10 5v10"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </motion.button>
          ))}
        </div>
      </div>

      <ol className="grid grid-cols-6 gap-1.5 px-4 pb-4">
        {thumbs.map((p, i) => {
          const pick = i % 3 !== 1 && i < picksShown
          return (
            <li key={p.id} className="relative aspect-square">
              <Image src={p.src} alt="" fill sizes="64px" className={cn("object-cover transition-[opacity,filter] duration-500", !pick && "opacity-30 grayscale")} />
              <motion.span
                className="absolute inset-0"
                animate={{ opacity: pick ? 1 : 0, scale: pick ? 1 : 1.15 }}
                transition={{ duration: 0.35, delay: (i % 6) * 0.03 }}
              >
                <Viewfinder inset={-3} size={8} />
              </motion.span>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-2 border-t border-line bg-surface-sunken px-4 py-3">
        {/* Rejects always add up: 2,184 − picks. At 612 picks: 214 + 96 + 1,262 = 1,572. */}
        <Chip>Blur 214</Chip>
        <Chip>Eyes closed 96</Chip>
        <Chip>Duplicates {(total - n - 214 - 96).toLocaleString("en-US")}</Chip>
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */
/* 03 Deliver                                                                  */
/* -------------------------------------------------------------------------- */

export function DeliverVisual() {
  const photos = useSitePhotos()
  const grid = [photos.gardenProcession, photos.closeEmbrace, photos.mandapCouple, photos.marigoldMandap, photos.bridalPortrait, photos.familyCheer]
  return (
    <div className="relative mx-auto flex max-w-[420px] justify-center pt-20 pb-10" aria-label="Sample client gallery on a phone, with a delivery email" role="img">
      {/* Phone */}
      <div className="relative w-[248px] overflow-hidden rounded-[34px] border border-line-strong bg-surface-sunken p-2 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]">
        <div className="overflow-hidden rounded-[26px] bg-surface">
          <div className="relative h-[220px]">
            <Image src={photos.skyEmbrace.src} alt="" fill sizes="240px" className="object-cover" />
            <span className="absolute top-3 right-3 rounded-full bg-white/85 px-2 py-0.5 type-label text-fixed-dark">Sample</span>
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.75)] via-transparent to-[rgb(var(--scrim)/0.35)]" />
            <p className="absolute top-3 left-3 font-heading text-micro font-bold tracking-[0.2em] text-white uppercase">Saffron Lane</p>
            <div className="absolute inset-x-3 bottom-3 text-white">
              <p className="font-heading text-stat leading-6 font-bold">Aarohi & Kabir</p>
              <p className="mt-1 type-label text-white/80">Udaipur · 3 days</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden border-b border-line px-3 py-2">
            {["Haldi", "Sangeet", "Ceremony"].map((s, i) => (
              <span key={s} className={cn("type-label", i === 2 ? "text-ink" : "text-ink-muted")}>{s}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {grid.map((p) => (
              <div key={p.id} className="relative aspect-[4/5]">
                <Image src={p.src} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery email notification */}
      <motion.div
        className="absolute top-0 right-0 w-[230px] rounded-[var(--radius-control)] border border-line bg-surface-raised p-3 shadow-[var(--shadow-print)]"
        initial={{ opacity: 0, x: 24, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: develop }}
      >
        <p className="type-label text-ink-muted">Email · now</p>
        <p className="mt-1 type-caption text-ink">Your wedding photos are ready</p>
        <p className="mt-0.5 type-caption font-normal text-ink-muted">612 photos from Saffron Lane Studio</p>
      </motion.div>

      <motion.div
        className="absolute bottom-2 left-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: develop }}
      >
        <Chip tone="success" className="h-8 border border-line px-3">Delivered · PIN on</Chip>
      </motion.div>
    </div>
  )
}
