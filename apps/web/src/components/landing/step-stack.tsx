"use client"

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { CullVisual, DeliverVisual, UploadVisual } from "@/components/landing/step-visuals"
import { RevealText } from "@/components/motion/reveal"
import { EdgeLabel } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const steps = [
  {
    n: "01",
    title: "Upload once",
    body: "Drag in every card from every shooter. Files go straight to storage in parts, so a dropped connection picks up where it stopped instead of starting over.",
    detail: ["2,000+ files per upload", "Resumes after a drop", "EXIF read for every frame"],
    Visual: UploadVisual,
    tone: "bg-surface-raised",
  },
  {
    n: "02",
    title: "Cull to the number you want",
    body: "Say how many photos to deliver. Framesly removes blur, closed eyes and near-duplicates, keeps the best of each burst, and tells you why. You overrule anything.",
    detail: ["Blur and closed-eye checks", "Burst and duplicate grouping", "A reason on every decision"],
    Visual: CullVisual,
    tone: "bg-surface-sunken",
  },
  {
    n: "03",
    title: "Deliver in your brand",
    body: "Publish a private gallery with your logo and colours, one section per event. Clients favourite and download from the same files you uploaded.",
    detail: ["PIN and expiry", "ZIP downloads by email", "Previews when shared"],
    Visual: DeliverVisual,
    tone: "bg-surface-raised",
  },
]

function useIsLarge() {
  const [large, setLarge] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setLarge(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return large
}

/**
 * How it works, as a stack of cards. On large screens each card pins and the
 * next one slides over it; the cards underneath shrink and dim slightly, so
 * the stack reads as depth. Phones get the cards one after another.
 */
export function StepStack() {
  const ref = useRef<HTMLDivElement>(null)
  const large = useIsLarge()
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative pt-24 pb-12 md:pt-32">
      <div className="gutter mx-auto max-w-[var(--container-content)]">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <EdgeLabel tone="safelight">How it works</EdgeLabel>
            <RevealText as="h2" text="Three steps. One upload." className="mt-4 type-heading-1 md:type-display-l" />
          </div>
          <p className="max-w-md type-body-l text-ink-muted md:col-span-5">
            The file you upload is the file you cull, deliver and download. Nothing is copied
            between tools.
          </p>
        </div>

        <div ref={ref} className="relative mt-12 lg:mt-4">
          {steps.map((s, i) => (
            <StackCard key={s.n} step={s} index={i} total={steps.length} progress={scrollYProgress} animate={large && !reduce} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StackCard({
  step,
  index,
  total,
  progress,
  animate,
}: {
  step: (typeof steps)[number]
  index: number
  total: number
  progress: MotionValue<number>
  animate: boolean
}) {
  const depth = total - 1 - index
  const scale = useTransform(progress, [index / total, 1], [1, animate ? 1 - depth * 0.06 : 1])
  const shade = useTransform(progress, [index / total, 1], [0, animate ? depth * 0.16 : 0])
  const Visual = step.Visual

  return (
    <div className="mb-6 lg:sticky lg:top-0 lg:mb-0 lg:flex lg:h-dvh lg:items-center">
      <motion.article
        style={{ scale, marginTop: animate ? index * 28 : 0 }}
        className={cn(
          "relative w-full origin-top overflow-hidden rounded-[var(--radius-cover)] border border-line will-change-transform",
          step.tone,
          "lg:h-[min(640px,calc(100dvh-140px))]"
        )}
      >
        <div className="grain grid h-full grid-cols-[minmax(0,1fr)] gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-14">
          <div>
            <div className="flex items-center gap-4">
              <span className="type-metric text-safelight-text">{step.n}</span>
              <span className="h-px w-12 bg-line-strong" />
              <span className="type-label text-ink-muted">Step {index + 1} of {total}</span>
            </div>
            <h3 className="mt-6 type-heading-1 text-balance lg:type-display-l">{step.title}</h3>
            <p className="mt-5 max-w-md type-body-l text-ink-muted">{step.body}</p>
            <ul className="mt-8 grid gap-2 border-t border-line pt-6">
              {step.detail.map((d) => (
                <li key={d} className="flex items-center gap-3 type-caption text-ink">
                  <span aria-hidden className="h-px w-4 bg-safelight" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <Visual />
          </div>
        </div>
        {/* Cards underneath darken slightly as the stack grows */}
        <motion.div aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-surface-sunken" />
      </motion.article>
    </div>
  )
}
