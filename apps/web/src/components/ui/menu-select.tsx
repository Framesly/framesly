"use client"

import { AnimatePresence, motion } from "motion/react"
import { useId, useState } from "react"
import { createPortal } from "react-dom"

import { Icon } from "@/components/ui/icon"
import { usePopover } from "@/components/ui/use-popover"
import { cn } from "@/lib/utils"

export type MenuOption<V extends string> = { value: V; label: string; hint?: string; dot?: string }

/**
 * A compact select: a button showing the current choice, opening a listbox.
 * Keyboard: Enter/Space/Arrow opens, arrows move, Enter picks, Escape closes.
 * Changes apply at once; the parent saves in the background.
 */
export function MenuSelect<V extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string
  value: V
  options: MenuOption<V>[]
  onChange: (value: V) => void
  disabled?: boolean
  className?: string
}) {
  const { open, setOpen, close, root, trigger, panel, style, side } = usePopover({ height: options.length * 44 + 10 })
  const [active, setActive] = useState(0)
  const listId = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  const openAt = (index: number) => {
    setActive(index)
    setOpen(true)
  }
  const pick = (v: V) => {
    close(true)
    if (v !== value) onChange(v)
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? close() : openAt(Math.max(0, options.indexOf(current))))}
        onKeyDown={(e) => {
          if (!open && ["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault()
            openAt(Math.max(0, options.indexOf(current)))
          } else if (open && e.key === "ArrowDown") {
            e.preventDefault()
            setActive((i) => Math.min(options.length - 1, i + 1))
          } else if (open && e.key === "ArrowUp") {
            e.preventDefault()
            setActive((i) => Math.max(0, i - 1))
          } else if (open && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            pick(options[active].value)
          }
        }}
        className="flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-line-strong bg-surface-sunken pr-3 pl-3.5 text-left text-ink transition-colors hover:border-ink-muted disabled:opacity-50 [@media(pointer:fine)]:h-10"
      >
        {current.dot && <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: current.dot }} />}
        <span className="min-w-0 flex-1 truncate type-caption">{current.label}</span>
        <Icon name="chevron-down" className={cn("size-4 shrink-0 text-ink-muted transition-transform duration-200", open && "rotate-180")} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={panel as React.RefObject<HTMLUListElement | null>}
            style={style}
            id={listId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listId}-${active}`}
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="z-(--z-dropdown) overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-overlay p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.6)]"
          >
            {options.map((o, i) => {
              const selected = o.value === value
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[var(--radius-chip)] px-2.5 py-2 whitespace-nowrap",
                    i === active ? "bg-surface-raised text-ink" : "text-ink-muted"
                  )}
                >
                  {o.dot && <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: o.dot }} />}
                  <span className="flex-1">
                    <span className="block type-caption text-ink">{o.label}</span>
                    {o.hint && <span className="block text-micro leading-4 text-ink-muted">{o.hint}</span>}
                  </span>
                  {selected && <Icon name="check" className="size-4 text-safelight" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
