"use client"

import { motion } from "motion/react"
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

/*
 * Theme rules:
 * - Public site: light (ivory) by default.
 * - App after login (/app/*): Darkroom by default.
 * - Anyone can switch light/dark; the choice is remembered on this device and
 *   then applies everywhere. Until they choose, each area uses its default.
 */
export type Theme = "light" | "dark"
type Pref = Theme | "auto"

const KEY = "framesly-theme"
const EVENT = "framesly-theme-change"
const META = { light: "#f4efe6", dark: "#121417" } as const

/** Which part of the product a page belongs to. Set by each route group's layout. */
export type ThemeAreaName = "site" | "app"

/**
 * Runs in <head> before first paint so the page never flashes the wrong
 * theme. Mirrors resolveTheme() below; keep the two in sync.
 */
export const themeScript = `(function(){try{var p=null;try{p=localStorage.getItem("${KEY}")}catch(e){}var l=location.pathname,a=l==="/app"||l.indexOf("/app/")===0;var t=p==="light"||p==="dark"?p:a?"dark":"light";var d=document.documentElement;d.setAttribute("data-theme",t);d.style.colorScheme=t}catch(e){}})()`

function resolveTheme(pref: Pref, area: ThemeAreaName): Theme {
  if (pref === "light" || pref === "dark") return pref
  return area === "app" ? "dark" : "light"
}

/* Preference store: localStorage + same-tab event + cross-tab storage event. */
function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "auto"
  } catch {
    return "auto"
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

function applyTheme(theme: Theme) {
  const d = document.documentElement
  d.setAttribute("data-theme", theme)
  d.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[theme])
}

type Ctx = {
  pref: Pref
  setTheme: (t: Theme, origin?: { x: number; y: number }) => void
}
const ThemeContext = createContext<Ctx | null>(null)
const AreaContext = createContext<ThemeAreaName>("site")

/**
 * Holds the saved preference. It does not read the URL: reading it at the
 * root would make every dynamic route block prerendering (Cache Components).
 * The site/app default comes from <ThemeArea> in each route group's layout.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useSyncExternalStore(subscribe, readPref, () => "auto" as Pref)

  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    const commit = () => {
      try {
        localStorage.setItem(KEY, next)
      } catch {}
      applyTheme(next)
      window.dispatchEvent(new Event(EVENT))
    }
    const d = document.documentElement
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } })
      .startViewTransition
    if (!vt || reduce || d.getAttribute("data-theme") === next) {
      commit()
      return
    }
    // The new theme spreads out from the switch as a circle.
    d.style.setProperty("--tx", `${origin?.x ?? window.innerWidth / 2}px`)
    d.style.setProperty("--ty", `${origin?.y ?? 0}px`)
    d.setAttribute("data-theme-switching", "")
    const t = vt.call(document, commit)
    t.finished.finally(() => d.removeAttribute("data-theme-switching"))
  }, [])

  const value = useMemo(() => ({ pref, setTheme }), [pref, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Marks a part of the product: the public site defaults to light, the app to
 * Darkroom. Keeps <html> in step when navigating between areas or when the
 * preference changes.
 */
export function ThemeArea({ area, children }: { area: ThemeAreaName; children: React.ReactNode }) {
  const pref = useContext(ThemeContext)?.pref ?? "auto"
  const theme = resolveTheme(pref, area)
  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") !== theme) applyTheme(theme)
  }, [theme])
  return <AreaContext.Provider value={area}>{children}</AreaContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  const area = useContext(AreaContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return { theme: resolveTheme(ctx.pref, area), pref: ctx.pref, setTheme: ctx.setTheme }
}

const SunIcon = () => (
  <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
    <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)
const MoonIcon = () => (
  <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
    <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a6.8 6.8 0 1 0 8.8 8.8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

/**
 * Light / dark switch. A two-option segmented control (not a single toggle)
 * so the current choice is always readable. `labels` shows text for menus.
 */
export function ThemeSwitch({ className, labels = false, id = "theme" }: { className?: string; labels?: boolean; id?: string }) {
  const { theme, setTheme } = useTheme()
  const options: { value: Theme; label: string; Icon: () => React.JSX.Element }[] = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "dark", label: "Darkroom", Icon: MoonIcon },
  ]
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex rounded-full border border-line bg-surface-sunken p-0.5", className)}>
      {options.map(({ value, label, Icon }) => {
        const on = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={labels ? undefined : `${label} theme`}
            title={`${label} theme`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setTheme(value, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
            }}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-full transition-colors",
              labels ? "h-11 flex-1 px-4 type-caption" : "size-9",
              on ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {on && (
              <motion.span
                layoutId={`theme-pill-${id}`}
                className="absolute inset-0 rounded-full border border-line-strong bg-surface-raised"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">
              <Icon />
            </span>
            {labels && <span className="relative">{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
