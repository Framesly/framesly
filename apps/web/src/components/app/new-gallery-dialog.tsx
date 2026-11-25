"use client"

import { AnimatePresence, motion } from "motion/react"
import { useActionState, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { FormAlert, SubmitButton } from "@/components/auth/primitives"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { createGalleryAction } from "@/features/galleries/actions"
import { idle } from "@/lib/action-state"
import { cn } from "@/lib/utils"

const presets = [
  { value: "multi-day", label: "Multi-day wedding", sections: "Haldi, Mehendi, Sangeet, Ceremony, Reception" },
  { value: "one-day", label: "One-day wedding", sections: "Getting ready, Ceremony, Reception" },
  { value: "custom", label: "My own sections", sections: "Type them below" },
  { value: "none", label: "No sections yet", sections: "Add them later" },
] as const

/** "New gallery" dialog: title, date and a section preset. */
export function NewGalleryDialog({ label = "New gallery", variant = "primary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New gallery">
        <NewGalleryForm onCancel={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function NewGalleryForm({ onCancel }: { onCancel: () => void }) {
  const [state, action] = useActionState(createGalleryAction, idle)
  const [preset, setPreset] = useState<(typeof presets)[number]["value"]>((state.values?.preset as never) ?? "multi-day")
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message && <FormAlert>{state.message}</FormAlert>}
      <Field label="Gallery name" name="title" placeholder="Aarohi & Kabir…" required autoComplete="off" defaultValue={state.values?.title} error={state.fieldErrors?.title} autoFocus />
      <Field label="Wedding date" name="eventDate" type="date" defaultValue={state.values?.eventDate} error={state.fieldErrors?.eventDate} hint="Optional. Helps you find galleries later." />
      <fieldset>
        <legend className="type-caption text-ink">Sections</legend>
        <p className="mt-1 type-caption font-normal text-ink-muted">One section per event. You can rename or reorder them later.</p>
        <input type="hidden" name="preset" value={preset} />
        <div role="radiogroup" aria-label="Section preset" className="mt-3 grid gap-2 sm:grid-cols-2">
          {presets.map((p) => {
            const on = preset === p.value
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPreset(p.value)}
                className={cn("rounded-[var(--radius-control)] border p-3 text-left transition-colors", on ? "border-safelight bg-safelight-soft" : "border-line hover:border-line-strong")}
              >
                <span className="block type-caption text-ink">{p.label}</span>
                <span className="mt-0.5 block type-caption font-normal text-ink-muted">{p.sections}</span>
              </button>
            )
          })}
        </div>
        {preset === "custom" && (
          <div className="mt-3">
            <Field label="Your sections" name="customSections" placeholder="Engagement, Wedding, After party…" defaultValue={state.values?.customSections} hint="Separate them with commas." autoComplete="off" />
          </div>
        )}
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Creating…" className="sm:w-auto">
          Create gallery
        </SubmitButton>
      </div>
    </form>
  )
}

/**
 * Accessible modal: focus moves in and returns on close, Esc and backdrop
 * close it, background scroll is locked, and it slides up on phones.
 */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const html = document.documentElement
    html.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
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
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <h2 id={titleId} className="type-heading-1">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink">
                <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
                  <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
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
