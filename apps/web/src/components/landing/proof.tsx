"use client"

import { motion } from "motion/react"

import { Counter, Reveal } from "@/components/motion/reveal"
import { EdgeLabel } from "@/components/ui/card"

/*
 * Example figures. Before launch, replace them with a real photographer's
 * numbers from a beta wedding.
 */
const metrics = [
  { value: 2184, label: "Frames uploaded" },
  { value: 612, label: "Picks delivered" },
  { value: 41, label: "Minutes, upload to picks" },
]

const develop = [0.22, 1, 0.36, 1] as const

export function Proof() {
  return (
    <section aria-labelledby="proof-title" className="border-y border-line bg-surface-raised">
      <div className="gutter mx-auto max-w-[var(--container-content)] py-16 md:py-20">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <h2 id="proof-title" className="type-heading-2 text-ink">
            One wedding, start to finish
          </h2>
          <EdgeLabel>Example wedding</EdgeLabel>
        </div>

        <dl className="mt-10 grid gap-y-10 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <Reveal
              key={m.label}
              delay={i * 0.08}
              className="border-line sm:border-l sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
            >
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <Counter to={m.value} className="font-heading text-[56px] leading-none font-bold tracking-[-0.04em] md:text-[72px]" />
                <p className="mt-3 type-label text-ink-muted">{m.label}</p>
              </dd>
            </Reveal>
          ))}
        </dl>

        {/* By hand vs Framesly, to scale (3 working days ≈ 1,440 minutes). */}
        <div className="mt-14 space-y-4" role="img" aria-label="Culling by hand takes about three working days; Framesly takes 41 minutes.">
          {[
            { label: "By hand", value: "About 3 days", width: "100%", tone: "bg-line-strong" },
            { label: "Framesly", value: "41 min", width: "2.8%", tone: "bg-safelight" },
          ].map((row, i) => (
            <div key={row.label} className="grid grid-cols-[88px_1fr] items-center gap-4 sm:grid-cols-[120px_1fr_120px]">
              <span className="type-label text-ink-muted">{row.label}</span>
              <div className="h-2 bg-surface-sunken">
                {/* scaleX (compositor only) instead of animating width. */}
                <motion.div
                  className={`h-full origin-left ${row.tone}`}
                  style={{ width: row.width, minWidth: 6 }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: i === 0 ? 1.8 : 0.6, ease: develop, delay: i === 0 ? 0.1 : 1.6 }}
                />
              </div>
              <span className="col-start-2 type-metric text-ink sm:col-start-auto sm:text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
