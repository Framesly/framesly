"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"

import { Icon } from "@/components/ui/icon"
import { useFocusTrap } from "@/components/ui/use-focus-trap"

/**
 * Accessible modal: focus moves in and returns on close, Tab stays inside,
 * Esc and the backdrop close it, background scroll is locked, and it slides
 * up from the bottom on phones.
 */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useFocusTrap(panel, open)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const html = document.documentElement
    html.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      html.style.overflow = ""
      previous?.focus()
    }
  }, [open, onClose])

  if (typeof document === "undefined") return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-(--z-dialog) flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-[rgb(var(--scrim)/0.6)]" onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-cover)] border border-line bg-surface-raised p-6 [overscroll-behavior:contain] sm:max-w-lg sm:rounded-[var(--radius-cover)] sm:p-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 id={titleId} className="type-heading-1">
                {title}
              </h2>
              <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink">
                <Icon name="close" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
