"use client"

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, wrap } from "motion/react"
import { Fragment, useRef } from "react"

/** The events of a wedding week, in the order they usually happen. */
const EVENTS = ["Haldi", "Mehendi", "Sangeet", "Baraat", "Pheras", "Nikah", "Anand Karaj", "Reception", "Vidaai"]

/**
 * One row of event names drifting sideways. Scrolling speeds it up, and
 * scrolling back reverses it, so the band answers the reader's hand. Only
 * transform changes; it stops while off screen and holds still for reduced motion.
 */
function Row({ speed, outlined, offset = 0 }: { speed: number; outlined: boolean; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() ?? false
  const visible = useInView(ref, { margin: "100px 0px" })
  const base = useMotionValue(offset)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [-1200, 0, 1200], [-5, 0, 5], { clamp: false })
  const direction = useRef(1)
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`)

  useAnimationFrame((_, delta) => {
    if (reduce || !visible) return
    const b = boost.get()
    if (b < 0) direction.current = -1
    else if (b > 0) direction.current = 1
    let move = direction.current * speed * (delta / 1000)
    move += direction.current * move * Math.abs(b)
    base.set(base.get() + move)
  })

  const words = (
    <>
      {EVENTS.map((e) => (
        <Fragment key={e}>
          <span className={outlined ? "text-transparent [-webkit-text-stroke:1px_var(--line-strong)]" : "text-ink"}>{e}</span>
          <span aria-hidden className="mx-[0.35em] inline-block size-[0.14em] translate-y-[-0.28em] rounded-full bg-safelight align-middle" />
        </Fragment>
      ))}
    </>
  )
  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div style={{ x }} className="flex w-max font-heading text-[clamp(44px,8vw,116px)] leading-[1.05] font-bold tracking-[-0.03em] whitespace-nowrap will-change-transform">
        <span className="pr-[0.35em]">{words}</span>
        <span className="pr-[0.35em]" aria-hidden>
          {words}
        </span>
      </motion.div>
    </div>
  )
}

/** Between the photo ribbon and the numbers: every event of the week, in one upload. */
export function EventMarquee() {
  return (
    <section aria-label="Every event of the wedding week" className="overflow-hidden border-t border-line py-10 md:py-14">
      <p className="sr-only">{EVENTS.join(", ")}: every event of the week goes into one upload.</p>
      <div aria-hidden className="space-y-1">
        <Row speed={2.2} outlined={false} />
        <Row speed={-1.6} outlined offset={-25} />
      </div>
    </section>
  )
}
