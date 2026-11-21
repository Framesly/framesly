"use client"

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"
import Image from "next/image"
import { useRef } from "react"

import { RevealText } from "@/components/motion/reveal"
import { ButtonArrow, ButtonLink } from "@/components/ui/button"
import { EdgeLabel } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"
import { photos, type Photo } from "@/lib/photos"
import { cn } from "@/lib/utils"

const rowA = [photos.bridalLaugh, photos.closeEmbrace, photos.mandapCouple, photos.shawlCanopy, photos.bridalPortrait, photos.hallEntrance, photos.marigoldMandap, photos.avenueWalk, photos.nikahCouple]
const rowB = [photos.receptionStage, photos.lakeDance, photos.steppingStones, photos.sunglassesDance, photos.seaBreeze, photos.brickArches, photos.veilLaugh, photos.horseMono, photos.jointLaugh]

/** A row of prints that slides with the scroll; picks get brackets, rejects stay grey. */
function PrintRow({ items, picks, progress, from, to }: { items: Photo[]; picks: number[]; progress: MotionValue<number>; from: string; to: string }) {
  const x = useTransform(progress, [0, 1], [from, to])
  return (
    <motion.div style={{ x }} className="flex w-max gap-4 will-change-transform">
      {items.map((p, i) => {
        const pick = picks.includes(i)
        return (
          <div
            key={p.id}
            className={cn("print relative h-[130px] w-[104px] shrink-0 sm:h-[180px] sm:w-[144px]", !pick && "opacity-50")}
            style={{ rotate: `${((i * 37) % 7) - 3}deg` }}
          >
            <div className="relative size-full overflow-hidden">
              <Image src={p.src} alt="" fill sizes="144px" className={cn("object-cover", !pick && "grayscale")} />
            </div>
            {pick && <Viewfinder inset={-8} size={12} />}
          </div>
        )
      })}
    </motion.div>
  )
}

export function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })

  return (
    <section ref={ref} aria-labelledby="final-title" className="grain relative overflow-hidden border-t border-line py-28 md:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-10 opacity-70">
        <PrintRow items={rowA} picks={[0, 2, 5, 7]} progress={scrollYProgress} from={reduce ? "-10%" : "0%"} to={reduce ? "-10%" : "-30%"} />
        <PrintRow items={rowB} picks={[1, 4, 6]} progress={scrollYProgress} from={reduce ? "-20%" : "-35%"} to={reduce ? "-20%" : "-5%"} />
      </div>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_center,var(--surface)_45%,transparent_100%)]" />

      <div className="gutter relative mx-auto flex max-w-[var(--container-content)] flex-col items-center text-center">
        <EdgeLabel tone="safelight">Ready when your next wedding is</EdgeLabel>
        <RevealText
          as="h2"
          text="Deliver this weekend's wedding by Monday."
          className="mt-5 max-w-3xl type-display-l text-balance md:type-display-xl"
        />
        <p className="mt-6 max-w-lg type-body-l text-ink-muted">
          Start free. Upload one real wedding and see how many hours come back.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href="/signup" size="lg" data-cta="final-start-free">
            Start free
            <ButtonArrow />
          </ButtonLink>
          <ButtonLink href="/sample" size="lg" variant="secondary" data-cta="final-sample-gallery">
            See a sample gallery
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
