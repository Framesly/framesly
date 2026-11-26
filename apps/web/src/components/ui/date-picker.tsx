"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Icon } from "@/components/ui/icon"
import { usePopover } from "@/components/ui/use-popover"
import { cn } from "@/lib/utils"

/* Dates are plain calendar days ("2026-11-17"), handled in UTC so no time zone shifts them. */
const toISO = (d: Date) => d.toISOString().slice(0, 10)
const fromISO = (s: string) => new Date(`${s}T00:00:00Z`)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const todayISO = () => {
  const now = new Date()
  return toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

const buttonFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const monthFmt = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
const dayFmt = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

/** Six Monday-first weeks covering the month that contains `month`. */
function monthGrid(month: Date) {
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const start = addDays(first, -((first.getUTCDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/**
 * A date button that opens a small calendar. Arrow keys move by day and week,
 * PageUp/PageDown by month, Enter picks, Escape closes. `min` greys out
 * earlier days. Value is "YYYY-MM-DD" or null.
 */
export function DatePicker({
  label,
  value,
  onChange,
  min,
  placeholder = "Add a date",
  clearable = true,
  className,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  min?: string
  placeholder?: string
  clearable?: boolean
  className?: string
}) {
  const { open, setOpen, close, root, trigger, panel, style, side } = usePopover({ width: 296, height: 360 })
  const [focus, setFocus] = useState(() => value ?? todayISO())
  const gridId = useId()
  const grid = useRef<HTMLDivElement>(null)
  const monthKey = focus.slice(0, 7)
  const month = useMemo(() => fromISO(`${monthKey}-01`), [monthKey])
  const days = useMemo(() => monthGrid(month), [month])
  const today = todayISO()

  // Keep keyboard focus on the focused day while the calendar is open.
  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus()
  }, [open, focus])

  const toggle = () => {
    if (!open) setFocus(value ?? (min && today < min ? min : today))
    setOpen(!open)
  }
  const pick = (iso: string | null) => {
    close(true)
    if (iso !== value) onChange(iso)
  }
  const move = (iso: string) => setFocus(min && iso < min ? min : iso)
  const shiftMonth = (n: number) => {
    const d = fromISO(focus)
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    move(toISO(new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), last)))))
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value ? buttonFmt.format(fromISO(value)) : "not set"}`}
        onClick={toggle}
        className="flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-line-strong bg-surface-sunken px-3.5 text-left transition-colors hover:border-ink-muted [@media(pointer:fine)]:h-10"
      >
        <svg viewBox="0 0 20 20" aria-hidden className="size-4 shrink-0 text-ink-muted">
          <rect x="3" y="4.5" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className={cn("min-w-0 flex-1 truncate type-caption", value ? "text-ink" : "text-ink-muted")}>{value ? buttonFmt.format(fromISO(value)) : placeholder}</span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            style={style}
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "z-(--z-dropdown) rounded-[var(--radius-control)] border border-line bg-surface-overlay p-3 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.6)]",
              side === "top" ? "origin-bottom-left" : "origin-top-left"
            )}
          >
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-raised hover:text-ink">
                <Icon name="chevron-left" className="size-4" />
              </button>
              <p className="type-caption text-ink" aria-live="polite">{monthFmt.format(month)}</p>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-raised hover:text-ink">
                <Icon name="chevron-right" className="size-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 text-center text-micro leading-6 text-ink-muted" aria-hidden>
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div
              ref={grid}
              id={gridId}
              role="grid"
              aria-label={monthFmt.format(month)}
              className="grid grid-cols-7 gap-0.5"
              onKeyDown={(e) => {
                const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
                if (step) {
                  e.preventDefault()
                  move(toISO(addDays(fromISO(focus), step)))
                } else if (e.key === "PageUp" || e.key === "PageDown") {
                  e.preventDefault()
                  shiftMonth(e.key === "PageUp" ? -1 : 1)
                }
              }}
            >
              {days.map((d) => {
                const iso = toISO(d)
                const inMonth = d.getUTCMonth() === month.getUTCMonth()
                const disabled = Boolean(min && iso < min)
                const selected = iso === value
                return (
                  <button
                    key={iso}
                    type="button"
                    data-day={iso}
                    tabIndex={iso === focus ? 0 : -1}
                    disabled={disabled}
                    aria-label={dayFmt.format(d)}
                    aria-pressed={selected}
                    aria-current={iso === today ? "date" : undefined}
                    onClick={() => pick(iso)}
                    className={cn(
                      "relative grid h-9 place-items-center rounded-full text-caption tabular-nums transition-colors",
                      selected ? "bg-safelight font-semibold text-on-safelight" : inMonth ? "text-ink hover:bg-surface-raised" : "text-ink-muted/50 hover:bg-surface-raised",
                      disabled && "pointer-events-none opacity-30"
                    )}
                  >
                    {d.getUTCDate()}
                    {iso === today && !selected && <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-safelight" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                disabled={Boolean(min && today < min)}
                onClick={() => pick(today)}
                className="h-9 rounded-full px-3 type-caption text-safelight-text hover:bg-surface-raised disabled:opacity-40"
              >
                Today
              </button>
              {clearable && value && (
                <button type="button" onClick={() => pick(null)} className="h-9 rounded-full px-3 type-caption text-ink-muted hover:bg-surface-raised hover:text-ink">
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
