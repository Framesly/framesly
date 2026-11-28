"use client"

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"

/**
 * Reading the page like a roll of film: a thin amber line across the top
 * fills as you scroll. Transform only, so it costs nothing per frame.
 */
export function ScrollFilm() {
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-(--z-header) h-0.5 origin-left bg-safelight"
    />
  )
}
