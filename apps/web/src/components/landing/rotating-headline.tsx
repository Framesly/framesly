"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type Phase = "in" | "out" | "wait"

/** The next headline starts rising only after the last outgoing word has left (stagger + 420ms exit). */
const ENTER_AFTER = 560

/**
 * Cycles through whole headlines. Each word sits in its own clipping box and
 * slides: the current headline's words leave upwards, left to right, and once
 * they are gone the next headline's words rise into place. Only one headline is ever visible, so
 * nothing cross-fades on top of anything else.
 *
 * Layout: every headline occupies the same grid cell, so the block is always
 * as tall as the tallest one and the page below never moves. Only transform
 * animates. The parent supplies the accessible text; this is aria-hidden.
 * Rotation stops for reduced motion and while the tab is in the background.
 */
export function RotatingHeadline({ lines, interval = 4200, className }: { lines: string[]; interval?: number; className?: string }) {
  const [{ index, prev }, setState] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null })

  useEffect(() => {
    if (lines.length < 2) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    let timer: ReturnType<typeof setInterval> | undefined

    const advance = () => setState((s) => ({ index: (s.index + 1) % lines.length, prev: s.index }))
    const start = () => {
      if (timer || reduce.matches || document.hidden) return
      timer = setInterval(advance, interval)
    }
    const stop = () => {
      clearInterval(timer)
      timer = undefined
    }
    const sync = () => {
      if (reduce.matches) setState({ index: 0, prev: null })
      if (reduce.matches || document.hidden) stop()
      else start()
    }

    start()
    document.addEventListener("visibilitychange", sync)
    reduce.addEventListener("change", sync)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", sync)
      reduce.removeEventListener("change", sync)
    }
  }, [lines.length, interval])

  return (
    <span aria-hidden className={cn("grid", className)}>
      {lines.map((line, li) => {
        const phase: Phase = li === index ? "in" : li === prev ? "out" : "wait"
        return (
          <span key={line} className={cn("col-start-1 row-start-1 block text-balance", phase === "wait" && "invisible")}>
            {line.split(" ").map((word, wi) => (
              <span key={wi}>
                {/* Padding keeps descenders inside the clip; the negative margin cancels it in the layout. */}
                <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top">
                  <span
                    className={cn(
                      "inline-block will-change-transform",
                      phase === "in" && "translate-y-0 transition-transform duration-700 ease-[var(--ease-develop)]",
                      phase === "out" && "-translate-y-[115%] transition-transform duration-[420ms] ease-[cubic-bezier(0.55,0,0.75,0.2)]",
                      phase === "wait" && "translate-y-[115%]"
                    )}
                    style={{ transitionDelay: phase === "in" ? `${ENTER_AFTER + wi * 45}ms` : phase === "out" ? `${wi * 30}ms` : undefined }}
                  >
                    {word}
                  </span>
                </span>{" "}
              </span>
            ))}
          </span>
        )
      })}
    </span>
  )
}
