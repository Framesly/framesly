"use client"

import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

const KEY = "framesly-consent"

/**
 * Cookie consent, required for EU and UK visitors.
 * Planned: show it only to EU/UK visitors once a country header is available
 * from the CDN, and load analytics only when `analytics === "granted"`.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Wait a beat so the banner never competes with the hero's first paint.
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(KEY)) setShow(true)
      } catch {
        // storage blocked: never nag
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  const choose = (analytics: "granted" | "denied") => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics, at: Date.now() }))
    } catch {}
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-(--z-banner) sm:right-auto sm:left-6 sm:bottom-6 sm:max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.25 } }}
        >
          <div className="rounded-[var(--radius-control)] border border-line-strong bg-surface-raised p-5 shadow-float">
            <p className="type-label text-ink-muted">Cookies</p>
            <p className="mt-2 text-ink">
              We use essential cookies to run Framesly. With your permission we also measure how the
              site is used.{" "}
              <Link href="/legal/privacy" className="text-safelight-text underline underline-offset-4">
                Privacy
              </Link>
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => choose("granted")} className="flex-1">
                Allow analytics
              </Button>
              <Button variant="quiet" size="sm" onClick={() => choose("denied")} className="flex-1">
                Essential only
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
