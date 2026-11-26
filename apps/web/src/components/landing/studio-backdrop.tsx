"use client"

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

/**
 * A quiet studio behind the home page: a softbox light on a stand at the
 * left, throwing a faint pool of light across the page, and a photographer
 * at the right with the camera up to his eye. Every few seconds the strobe
 * fires a soft flash, as if he has just taken the shot.
 *
 * It is one still layer fixed behind all content (sections with their own
 * background cover it) that fades in after the hero. Only two things ever
 * change: the layer's opacity while it fades in, and the small flash near the
 * softbox. Keeping it still and the glows small is what keeps scrolling
 * smooth. Decorative: hidden from assistive tech; no flash for reduced motion.
 */
export function StudioBackdrop() {
  const reduce = useReducedMotion() ?? false
  const { scrollY } = useScroll()
  // Out of the way during the hero; present for the rest of the page.
  const opacity = useTransform(scrollY, (y) => (typeof window === "undefined" ? 0 : Math.min(1, Math.max(0, (y - window.innerHeight * 0.7) / (window.innerHeight * 0.6)))))

  return (
    <motion.div aria-hidden style={{ opacity }} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict]">
      {/* The pool of light from the softbox: sized to the lit area, not the whole screen */}
      <div className="absolute top-[8%] left-[-6%] h-[70%] w-[62%] [background:radial-gradient(closest-side,color-mix(in_oklab,var(--safelight)_10%,transparent),transparent)]" />
      {!reduce && (
        <div className="studio-flash absolute top-[18%] left-[2%] h-[46%] w-[36%] [background:radial-gradient(closest-side,color-mix(in_oklab,var(--ink)_12%,transparent),transparent)]" />
      )}

      {/* Softbox on a stand */}
      <svg
        viewBox="0 0 420 760"
        className="absolute bottom-0 left-[-3vw] -rotate-2 h-[78vh] max-h-[760px] w-auto origin-bottom opacity-70 max-sm:left-[-18vw] max-sm:h-[52vh] max-sm:opacity-40"
      >
        <g fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
          {/* stand and tripod legs */}
          <path d="M168 300 L168 640" />
          <path d="M168 640 L92 742 M168 640 L246 742 M168 640 L172 748" />
          <path d="M150 470 L186 470" />
          {/* bracket and strobe head */}
          <path d="M168 300 L196 268" />
          <rect x="182" y="232" width="44" height="40" rx="6" transform="rotate(-24 204 252)" />
          {/* softbox: a deep octagon seen at an angle, mouth facing the room */}
          <path d="M214 246 L296 92 L380 120 L404 214 L364 330 L282 352 Z" />
          <path d="M214 246 L296 92 M214 246 L380 120 M214 246 L404 214 M214 246 L364 330 M214 246 L282 352" opacity="0.6" />
        </g>
        {/* the lit diffuser face */}
        <path d="M296 92 L380 120 L404 214 L364 330 L282 352 L262 224 Z" fill="var(--safelight)" opacity="0.07" />
        <path d="M296 92 L380 120 L404 214 L364 330 L282 352" fill="none" stroke="var(--safelight)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      </svg>

      {/* Photographer, camera to his eye, facing the light */}
      <svg
        viewBox="0 0 360 760"
        className="absolute right-[-2vw] bottom-0 h-[74vh] max-h-[740px] w-auto opacity-80 max-sm:right-[-22vw] max-sm:h-[50vh] max-sm:opacity-45"
      >
        <g fill="var(--ink)" opacity="0.06">
          {/* head and hair */}
          <circle cx="232" cy="172" r="34" />
          <path d="M200 160 Q212 128 244 132 Q270 136 270 168 Q256 150 230 152 Q210 154 200 160 Z" />
          {/* neck and torso, leaning slightly into the shot */}
          <path d="M218 200 L246 200 L250 226 L214 226 Z" />
          <path d="M190 236 Q232 220 286 240 L300 420 Q300 448 278 456 L210 458 Q186 452 186 428 Z" />
          {/* arms raised to the camera */}
          <path d="M196 248 Q170 290 168 318 Q166 336 182 334 L206 292 Z" />
          <path d="M178 318 L150 206 L166 200 L196 300 Z" />
          <path d="M280 252 Q262 290 222 300 L204 258 L214 246 Q246 270 262 236 Z" />
          {/* camera: body, grip and lens pointing toward the light */}
          <rect x="150" y="168" width="64" height="44" rx="7" />
          <rect x="112" y="176" width="42" height="30" rx="5" />
          <rect x="166" y="158" width="24" height="12" rx="3" />
          {/* legs and shoes */}
          <path d="M212 452 L196 724 L222 726 L240 488 L256 726 L284 724 L278 452 Z" />
          <path d="M180 724 L226 724 L226 740 L176 740 Z M250 724 L298 724 L304 740 L250 740 Z" />
        </g>
        {/* rim light on the side that faces the softbox */}
        <g fill="none" stroke="var(--safelight)" strokeWidth="2" strokeLinecap="round" opacity="0.32">
          <path d="M200 160 Q206 140 224 136" />
          <path d="M112 182 L112 200 M152 170 L212 170" />
          <path d="M190 238 Q186 330 188 428" />
          <path d="M212 456 L196 720" />
        </g>
        {/* a tiny catch of light in the lens */}
        <circle className={reduce ? undefined : "studio-lens"} cx="118" cy="191" r="5" fill="var(--safelight)" opacity="0.35" />
      </svg>
    </motion.div>
  )
}
