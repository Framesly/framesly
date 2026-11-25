"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"

const GAP = 6
const EDGE = 8

/**
 * Open/close state and placement for a small popover anchored to a trigger.
 *
 * The panel is meant to be portalled to <body> with `style`, so dialogs and
 * scroll containers never clip it. It opens below the trigger, or above when
 * there is more room there, and stays inside the viewport. It closes on a
 * click outside, on Escape (returning focus to the trigger), when focus leaves
 * both, and follows the trigger on scroll and resize. Listeners exist only
 * while it is open.
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>({ width, height }: { width?: number; height: number }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden" })
  const [side, setSide] = useState<"top" | "bottom">("bottom")
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<T>(null)
  const panel = useRef<HTMLDivElement>(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }, [])

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect()
    if (!r) return
    const w = width ?? r.width
    const below = window.innerHeight - r.bottom
    const up = below < height + GAP + EDGE && r.top > below
    const left = Math.min(Math.max(EDGE, r.left), window.innerWidth - w - EDGE)
    setSide(up ? "top" : "bottom")
    setStyle({
      position: "fixed",
      left,
      width: w,
      ...(up ? { bottom: window.innerHeight - r.top + GAP } : { top: r.bottom + GAP }),
    })
  }, [width, height])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const inside = (n: EventTarget | null) => n instanceof Node && (root.current?.contains(n) || panel.current?.contains(n))
    const onPointer = (e: PointerEvent) => {
      if (!inside(e.target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        close(true)
      }
    }
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    document.addEventListener("focusin", onFocus)
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("focusin", onFocus)
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, close, place])

  return { open, setOpen, close, root, trigger, panel, style, side }
}
