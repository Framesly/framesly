"use client"

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react"
import { useRef, useState } from "react"

/** The example wedding the page follows: the counter runs through its frames as you scroll. */
const FRAMES = 2184

/**
 * Reading the page like a roll of film: a thin amber line across the top
 * fills as you scroll, and on wide screens a frame counter in the corner
 * runs from 0001 to 2184. The counter text is written straight to the DOM so
 * scrolling never re-renders React; it appears after the hero.
 */
export function ScrollFilm() {
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress, scrollY } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 })
  const counter = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(false)

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (counter.current) counter.current.textContent = String(Math.max(1, Math.round(v * FRAMES))).padStart(4, "0")
  })
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > window.innerHeight * 0.9
    if (next !== shown) setShown(next)
  })

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: reduce ? scrollYProgress : scaleX }}
        className="pointer-events-none fixed inset-x-0 top-0 z-(--z-header) h-0.5 origin-left bg-safelight"
      />
      <div
        aria-hidden
        className={`pointer-events-none fixed right-5 bottom-5 z-(--z-nav) hidden items-center gap-2 rounded-full border border-line bg-surface-sunken/80 px-3 py-1.5 font-mono text-micro tracking-[0.14em] text-ink-muted backdrop-blur transition-opacity duration-500 lg:flex ${shown ? "opacity-100" : "opacity-0"}`}
      >
        <span className="size-1.5 rounded-full bg-safelight" />
        FR <span ref={counter} className="text-ink tabular-nums">0001</span> / {FRAMES.toLocaleString("en")}
      </div>
    </>
  )
}
