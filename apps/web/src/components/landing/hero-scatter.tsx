"use client"

import {
  easeIn,
  easeInOut,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import Image from "next/image"
import { useEffect, useRef, useState, type RefObject, useMemo } from "react"

import { ButtonArrow, ButtonLink, TextLink } from "@/components/ui/button"
import { Chip, EdgeLabel } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"
import { useSitePhotos } from "@/components/site/site-photos"
import { type SitePhotos, type Photo } from "@/lib/photos"
import { cn, frameNo } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* The table of prints                                                         */
/* -------------------------------------------------------------------------- */

type PrintDef = {
  photo: Photo
  frame: number
  pick: boolean
  reason?: string
  /** Desktop scatter position, -1..1 of the half viewport. */
  d: [number, number]
  /** Phone scatter position: a top band and a bottom band around the headline. */
  m: [number, number]
  rotate: number
  /** Pointer parallax strength. */
  depth: number
  crop?: string
}

const buildPrints = (photos: SitePhotos): PrintDef[] => [
  { photo: photos.bridalLaugh, frame: 408, pick: true, d: [-0.84, -0.42], m: [-0.82, -0.74], rotate: -7, depth: 1 },
  { photo: photos.hennaHands, frame: 409, pick: false, reason: "Blur", d: [-0.5, -0.66], m: [-0.3, -0.8], rotate: 5, depth: 0.5 },
  { photo: photos.mandapCouple, frame: 410, pick: true, d: [0.52, -0.64], m: [0.22, -0.72], rotate: -4, depth: 0.8, crop: "50% 50%" },
  { photo: photos.closeEmbrace, frame: 412, pick: true, d: [0.86, -0.34], m: [0.78, -0.78], rotate: 8, depth: 1.2 },
  { photo: photos.pujaRitual, frame: 413, pick: false, reason: "Eyes closed", d: [0.62, 0.08], m: [0.5, -0.6], rotate: -3, depth: 0.6 },
  { photo: photos.receptionStage, frame: 416, pick: true, d: [0.84, 0.62], m: [0.84, 0.76], rotate: 6, depth: 1.1 },
  { photo: photos.ringHands, frame: 417, pick: false, reason: "Blur", d: [0.4, 0.84], m: [0.4, 0.86], rotate: -9, depth: 0.7 },
  { photo: photos.bridalMirror, frame: 414, pick: true, d: [-0.12, 0.9], m: [-0.06, 0.8], rotate: 3, depth: 0.9, crop: "50% 30%" },
  { photo: photos.anandKaraj, frame: 419, pick: false, reason: "Eyes closed", d: [-0.44, 0.82], m: [-0.46, 0.88], rotate: 7, depth: 0.6 },
  { photo: photos.jointLaugh, frame: 418, pick: true, d: [-0.86, 0.48], m: [-0.84, 0.74], rotate: -5, depth: 1.2, crop: "50% 60%" },
  { photo: photos.mandapCouple, frame: 411, pick: false, reason: "Dup of 0410", d: [-0.64, 0.02], m: [-0.56, -0.58], rotate: 4, depth: 0.5, crop: "64% 40%" },
  { photo: photos.shawlCanopy, frame: 421, pick: true, d: [0.4, -0.86], m: [0.56, 0.62], rotate: -2, depth: 0.7, crop: "50% 40%" },
  { photo: photos.shawlCanopy, frame: 422, pick: false, reason: "Dup of 0421", d: [-0.38, -0.9], m: [-0.62, 0.6], rotate: 9, depth: 0.4, crop: "40% 70%" },
  { photo: photos.hallEntrance, frame: 425, pick: true, d: [0.4, 0.74], m: [0.1, 0.92], rotate: 5, depth: 0.9, crop: "50% 60%" },
]



/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

type Layout = {
  vw: number
  vh: number
  mobile: boolean
  /** Final grid cell size; the element is rendered at this size. */
  gw: number
  gh: number
  gap: number
  cols: number
  rows: number
  /** Grid centre, relative to the viewport centre. */
  gridY: number
  /** Scale of a loose print relative to its grid size. */
  looseScale: number
}

function computeLayout(vw: number, vh: number): Layout {
  const mobile = vw < 640
  const cols = mobile ? 2 : 4
  const rows = mobile ? 4 : 2
  const gap = mobile ? 10 : 18
  const top = mobile ? 168 : 190 // room for the caption above the grid
  const bottom = mobile ? 96 : 110
  const availW = Math.min(vw - (mobile ? 40 : 120), 1000)
  const availH = Math.max(vh - top - bottom, 240)
  let gw = (availW - gap * (cols - 1)) / cols
  gw = Math.min(gw, (availH - gap * (rows - 1)) / rows / 1.25)
  const gh = gw * 1.25
  const gridH = rows * gh + gap * (rows - 1)
  const looseW = mobile ? 80 : vw < 1024 ? 120 : Math.min(150, vw * 0.105)
  return {
    vw,
    vh,
    mobile,
    gw,
    gh,
    gap,
    cols,
    rows,
    gridY: top + gridH / 2 - vh / 2,
    looseScale: looseW / gw,
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Scroll-driven hero. At rest, loose prints drift on an ivory table around
 * the headline. Scrolling pins the scene: rejects get stamped with a reason
 * and fall away, picks slide into a gallery grid and get their brackets.
 *
 * Performance: every per-frame change is a transform or opacity driven by
 * Motion values (no React renders while scrolling), images are requested at
 * their grid size, and the idle drift stops as soon as scrolling starts.
 */
export function HeroScatter() {
  const photos = useSitePhotos()
  const prints = useMemo(() => buildPrints(photos), [photos])
  const pickOrder = useMemo(() => prints.filter((p) => p.pick), [prints])
  const sectionRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false

  const [layout, setLayout] = useState<Layout>(() => computeLayout(1280, 800))
  const [ready, setReady] = useState(false)
  const layoutRef = useRef(layout)
  const layoutTick = useMotionValue(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Use the visual viewport height so phone URL bars don't cause jumps.
        const next = computeLayout(window.innerWidth, document.documentElement.clientHeight)
        layoutRef.current = next
        setLayout(next)
        layoutTick.set(layoutTick.get() + 1)
        setReady(true)
      })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
    }
  }, [layoutTick])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] })
  const smooth = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.5 })
  const still = useMotionValue(0)
  const p = reduce ? still : smooth

  // Pointer parallax (fine pointers only), smoothed.
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 })
  const my = useSpring(rawY, { stiffness: 60, damping: 18 })
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1)
      rawY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [reduce, rawX, rawY])

  // Timeline
  const gather = useTransform(p, [0.04, 0.5], [0, 1], { ease: easeInOut })
  const fall = useTransform(p, [0.1, 0.4], [0, 1], { ease: easeIn })
  const stamp = useTransform(p, [0.02, 0.09], [0, 1])
  const brackets = useTransform(p, [0.46, 0.54], [0, 1])

  const headOpacity = useTransform(p, [0, 0.11], [1, 0])
  const headY = useTransform(p, [0, 0.16], [0, -70])
  const headScale = useTransform(p, [0, 0.16], [1, 0.96])
  const headVisibility = useTransform(p, (v) => (v > 0.14 ? "hidden" : "visible"))

  const capOpacity = useTransform(p, [0.42, 0.52], [0, 1])
  const capY = useTransform(p, [0.42, 0.52], [18, 0])
  const capVisibility = useTransform(p, (v) => (v < 0.4 ? "hidden" : "visible"))
  const hintOpacity = useTransform(p, [0, 0.04], [1, 0])

  // Idle drift only while the scene is at rest.
  const [drifting, setDrifting] = useState(true)
  useMotionValueEvent(p, "change", (v) => {
    const next = v < 0.015
    if (next !== drifting) setDrifting(next)
  })

  return (
    <section
      ref={sectionRef}
      aria-label="Framesly: cull a wedding before dinner"
      className={cn("relative", reduce ? "h-dvh min-h-[640px]" : "h-[300vh]")}
    >
      <div className="grain sticky top-0 h-dvh min-h-[560px] overflow-hidden">
        {/* Warm light on the table */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 50% 46%, var(--hero-glow) 0%, transparent 70%), radial-gradient(600px 400px at 12% 0%, rgb(209 130 0 / 0.10), transparent 70%)",
          }}
        />

        {/* Prints */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          {prints.map((def, i) => (
            <PrintCard
              key={`${def.frame}`}
              def={def}
              index={i}
              pickIndex={def.pick ? pickOrder.indexOf(def) : -1}
              layout={layout}
              layoutRef={layoutRef}
              layoutTick={layoutTick}
              gather={gather}
              fall={fall}
              stamp={stamp}
              brackets={brackets}
              mx={mx}
              my={my}
              drifting={drifting && !reduce}
              ready={ready}
            />
          ))}
        </div>

        {/* Headline (rest state) */}
        <motion.div
          style={{ opacity: headOpacity, y: headY, scale: headScale, visibility: headVisibility }}
          className="absolute inset-0 z-20 flex items-center justify-center px-4"
        >
          <div className="relative mx-auto max-w-[760px] text-center">
            <div
              aria-hidden
              className="absolute -inset-x-16 -inset-y-12 -z-10 rounded-full sm:-inset-x-24"
              style={{ background: "radial-gradient(closest-side, var(--surface) 55%, transparent)" }}
            />
            <div className="flex items-center justify-center gap-3">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-safelight opacity-60" />
                <span className="relative size-2 rounded-full bg-safelight" />
              </span>
              <EdgeLabel>Paid beta · for wedding photographers</EdgeLabel>
            </div>
            <h1 className="mt-5 type-display-l text-balance sm:text-[64px] sm:leading-[64px] lg:type-display-xl">
              Cull a wedding before dinner.
            </h1>
            <p className="mx-auto mt-5 max-w-[34rem] text-ink-muted sm:type-body-l">
              Upload the whole wedding once. Framesly picks the keepers, delivers a gallery in your
              brand, and serves every download from the same files.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg" data-cta="hero-start-free" className="w-full sm:w-auto">
                Start free
                <ButtonArrow />
              </ButtonLink>
              <ButtonLink href="/sample" size="lg" variant="secondary" data-cta="hero-sample-gallery" className="w-full sm:w-auto">
                See a sample gallery
              </ButtonLink>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        {!reduce && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden flex-col items-center gap-2 sm:flex"
            aria-hidden
          >
            <span className="type-label text-ink-muted">Scroll to cull</span>
            <span className="relative h-8 w-px overflow-hidden bg-line">
              <span className="absolute inset-x-0 top-0 h-3 animate-[drift_1.6s_ease-in-out_infinite] bg-safelight" />
            </span>
          </motion.div>
        )}

        {/* Caption (gathered state) */}
        <motion.div
          style={{ opacity: capOpacity, y: capY, visibility: capVisibility }}
          className="absolute inset-x-0 top-20 z-20 px-4 text-center sm:top-24"
        >
          <EdgeLabel tone="safelight">
            {/* Static number: the server HTML never says "0 frames scored". */}
            2,184 frames scored · example wedding
          </EdgeLabel>
          <p className="mx-auto mt-3 max-w-xl type-heading-1 text-balance sm:type-display-l">
            612 picks. 41 minutes.
          </p>
        </motion.div>
        <motion.div
          style={{ opacity: capOpacity, visibility: capVisibility }}
          className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-5 px-4 sm:bottom-10"
        >
          <ButtonLink href="/signup" size="sm" data-cta="hero-grid-start-free">
            Try it on your wedding
          </ButtonLink>
          <TextLink href="#how-it-works" className="hidden sm:inline-flex">
            How it works
          </TextLink>
        </motion.div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* One print                                                                   */
/* -------------------------------------------------------------------------- */

function PrintCard({
  def,
  index,
  pickIndex,
  layout,
  layoutRef,
  layoutTick,
  gather,
  fall,
  stamp,
  brackets,
  mx,
  my,
  drifting,
  ready,
}: {
  def: PrintDef
  index: number
  pickIndex: number
  layout: Layout
  layoutRef: RefObject<Layout>
  layoutTick: MotionValue<number>
  gather: MotionValue<number>
  fall: MotionValue<number>
  stamp: MotionValue<number>
  brackets: MotionValue<number>
  mx: MotionValue<number>
  my: MotionValue<number>
  drifting: boolean
  ready: boolean
}) {
  const dir = def.d[0] < 0 ? -1 : 1

  // Positions are read from a ref so the transforms never use a stale layout.
  const loose = () => {
    const L = layoutRef.current
    const [nx, ny] = L.mobile ? def.m : def.d
    const halfW = (L.gw * L.looseScale) / 2
    const halfH = (L.gh * L.looseScale) / 2
    // Keep loose prints clear of the fixed header: the top edge, allowing for
    // tilt, stays below 76px.
    const minY = -L.vh / 2 + 76 + halfH * 1.08
    return { x: nx * (L.vw / 2 - halfW * 0.6), y: Math.max(minY, ny * (L.vh / 2 - halfH * 0.55)) }
  }
  const cell = () => {
    const L = layoutRef.current
    const c = pickIndex % L.cols
    const r = Math.floor(pickIndex / L.cols)
    return {
      x: (c - (L.cols - 1) / 2) * (L.gw + L.gap),
      y: L.gridY + (r - (L.rows - 1) / 2) * (L.gh + L.gap),
    }
  }

  const x = useTransform([gather, fall, mx, layoutTick], ([g, f, m]: number[]) => {
    const a = loose()
    const par = m * 22 * def.depth
    if (!def.pick) return a.x + par + f * dir * 60
    return lerp(a.x + par, cell().x, g)
  })
  const y = useTransform([gather, fall, my, layoutTick], ([g, f, m]: number[]) => {
    const a = loose()
    const par = m * 16 * def.depth
    if (!def.pick) return a.y + par + f * layoutRef.current.vh * 0.85
    return lerp(a.y + par, cell().y, g)
  })
  const rotate = useTransform([gather, fall], ([g, f]: number[]) =>
    def.pick ? lerp(def.rotate, 0, g) : def.rotate + f * dir * 26
  )
  const scale = useTransform([gather, layoutTick], ([g]: number[]) => {
    const s = layoutRef.current.looseScale
    return def.pick ? lerp(s, 1, g) : s
  })
  const opacity = useTransform(fall, (f) => (def.pick ? 1 : 1 - Math.min(1, f * 1.15)))
  const dim = useTransform(stamp, (s) => (def.pick ? 0 : s * 0.5))

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        width: layout.gw,
        height: layout.gh,
        marginLeft: -layout.gw / 2,
        marginTop: -layout.gh / 2,
        zIndex: def.pick ? 2 : 1,
      }}
      className="absolute top-1/2 left-1/2 will-change-transform"
    >
      {/* Entrance: prints settle onto the table one by one */}
      <motion.div
        className="size-full"
        initial={{ opacity: 0, y: -30, rotate: def.rotate * 0.6 }}
        animate={ready ? { opacity: 1, y: 0, rotate: 0 } : undefined}
        transition={{ delay: 0.15 + index * 0.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Idle drift */}
        <div
          className="print relative size-full"
          style={
            drifting
              ? { animation: `drift ${6 + (index % 4)}s ease-in-out ${-(index * 0.7)}s infinite` }
              : undefined
          }
        >
          <div className="relative size-full overflow-hidden bg-surface-sunken">
            <Image
              src={def.photo.src}
              alt={def.photo.alt}
              fill
              sizes={`${Math.round(layout.gw)}px`}
              // Only the first few prints block first paint; the rest load right after.
              priority={index < 6}
              loading={index < 6 ? undefined : "eager"}
              quality={60}
              className="object-cover"
              style={{ objectPosition: def.crop }}
            />
            {!def.pick && (
              <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-[rgb(var(--scrim))]" />
            )}
          </div>

          {!def.pick && (
            <motion.div style={{ opacity: stamp }} className="absolute top-2 left-2">
              <Chip tone="reject" className="h-5 px-1.5 sm:h-6">
                {def.reason}
              </Chip>
            </motion.div>
          )}

          {def.pick && (
            <motion.div style={{ opacity: brackets }} className="absolute inset-0">
              <Viewfinder inset={-7} size={layout.mobile ? 10 : 14} />
              <span className="absolute bottom-2 left-2 rounded-[var(--radius-chip)] bg-[rgb(var(--scrim)/0.7)] px-1.5 py-0.5 type-label text-fixed-light">
                {frameNo(def.frame)}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
