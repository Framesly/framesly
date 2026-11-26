"use client"

import { animate, useInView, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import { RevealText } from "@/components/motion/reveal"
import { useSitePhotos } from "@/components/site/site-photos"
import { EdgeLabel } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"
import type { Photo, SitePhotos } from "@/lib/photos"
import { cn } from "@/lib/utils"

type Frame = { photo: Photo; keep: boolean; reason?: string }

const buildFrames = (p: SitePhotos): Frame[] => [
  { photo: p.bridalLaugh, keep: true },
  { photo: p.hennaHands, keep: false, reason: "Blur" },
  { photo: p.mandapCouple, keep: true },
  { photo: p.ringHands, keep: false, reason: "Duplicate" },
  { photo: p.closeEmbrace, keep: true },
  { photo: p.pujaRitual, keep: false, reason: "Eyes closed" },
  { photo: p.veilLaugh, keep: true },
  { photo: p.baraat, keep: true },
  { photo: p.bridalMirror, keep: false, reason: "Blur" },
  { photo: p.jointLaugh, keep: true },
  { photo: p.anandKaraj, keep: false, reason: "Eyes closed" },
  { photo: p.receptionStage, keep: true },
]

function Grid({ frames, culled }: { frames: Frame[]; culled: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
      {frames.map((f, i) => {
        const reject = culled && !f.keep
        return (
          <div key={f.photo.id} className={cn("relative aspect-[4/5] overflow-hidden bg-surface-sunken", i >= 9 && "hidden sm:block")}>
            <Image src={f.photo.src} alt="" fill sizes="(min-width: 1024px) 160px, 30vw" className={cn("object-cover", reject && "opacity-30 grayscale")} />
            <span className="absolute bottom-1 left-1.5 font-mono text-micro text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]">{String(408 + i).padStart(4, "0")}</span>
            {reject && (
              <>
                <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
                  <path d="M18 18 L82 82 M82 18 L18 82" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-1/2 rounded-sm bg-surface-sunken/85 px-1.5 py-0.5 font-mono text-micro whitespace-nowrap text-danger uppercase">
                  {f.reason}
                </span>
              </>
            )}
            {culled && f.keep && <Viewfinder inset={4} size={12} />}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Drag the line across a wedding: the left of it is the card as shot, the
 * right of it is what Framesly hands back, with rejects crossed out and the
 * reason given, and keepers framed. A real range input underneath makes it
 * work with the keyboard and screen readers. When it first comes into view
 * the line sweeps across once to show that it moves.
 */
export function CullCompare() {
  const photos = useSitePhotos()
  const frames = useMemo(() => buildFrames(photos), [photos])
  const reduce = useReducedMotion() ?? false
  const box = useRef<HTMLDivElement>(null)
  const inView = useInView(box, { once: true, margin: "0px 0px -25% 0px" })
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)

  // One sweep to hint that the line moves; any touch of it stops the hint.
  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(88, 42, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => !dragging.current && setPos(v) })
    return () => controls.stop()
  }, [inView, reduce])

  const fromPointer = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }

  const kept = frames.filter((f) => f.keep).length

  return (
    <section aria-labelledby="cull-compare-title" className="border-t border-line py-24 md:py-32">
      <div className="gutter mx-auto grid max-w-[var(--container-content)] items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <EdgeLabel tone="safelight">Try it</EdgeLabel>
          <RevealText as="h2" id="cull-compare-title" text="Drag the line. Watch a card get culled." className="mt-4 type-heading-1 md:type-display-l" />
          <p className="mt-5 max-w-sm text-ink-muted">
            Left of the line is the card as you shot it. Right of it is what Framesly hands back: keepers framed, the rest set aside with the reason. You can
            overrule any call.
          </p>
          <dl className="mt-8 grid max-w-sm grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-control)] border border-line bg-line">
            <div className="bg-surface px-4 py-3">
              <dt className="type-label text-ink-muted">As shot</dt>
              <dd className="mt-1 type-metric text-stat text-ink">2,184</dd>
            </div>
            <div className="bg-surface px-4 py-3">
              <dt className="type-label text-ink-muted">After Framesly</dt>
              <dd className="mt-1 type-metric text-stat text-safelight-text">612</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-8">
          <div
            ref={box}
            className="relative cursor-ew-resize touch-pan-y select-none"
            onPointerDown={(e) => {
              dragging.current = true
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
              fromPointer(e.clientX)
            }}
            onPointerMove={(e) => dragging.current && fromPointer(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <Grid frames={frames} culled={false} />
            <div aria-hidden className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
              <Grid frames={frames} culled />
            </div>

            <span aria-hidden className="pointer-events-none absolute top-2 left-2 rounded-full bg-surface-sunken/85 px-2.5 py-1 type-label text-ink-muted" style={{ opacity: pos > 18 ? 1 : 0 }}>
              As shot
            </span>
            <span aria-hidden className="pointer-events-none absolute top-2 right-2 rounded-full bg-surface-sunken/85 px-2.5 py-1 type-label text-safelight-text" style={{ opacity: pos < 82 ? 1 : 0 }}>
              After Framesly · {kept} kept
            </span>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(pos)}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label="Compare the card as shot with Framesly's picks"
              aria-valuetext={`${Math.round(100 - pos)}% of the grid shows Framesly's picks`}
              className="peer absolute inset-0 size-full cursor-ew-resize opacity-0"
              onPointerDown={() => (dragging.current = true)}
            />
            {/* The line and its handle */}
            <div aria-hidden className="peer-focus-visible:[&>span]:ring-2 pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-safelight shadow-[0_0_24px_var(--safelight)]" style={{ left: `${pos}%` }}>
              <span className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full bg-safelight text-on-safelight shadow-lg ring-safelight-text ring-offset-2 ring-offset-surface peer-focus-visible:ring-2">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
                </svg>
              </span>
            </div>

          </div>
          <p className="mt-3 type-label text-ink-muted">Drag, or use the arrow keys</p>
        </div>
      </div>
    </section>
  )
}
