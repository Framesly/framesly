"use client"

import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  Suspense,
  useState,
  type ComponentProps,
  type MouseEvent,
} from "react"

import { Wordmark } from "@/components/site/wordmark"
import { isAppPath } from "@/lib/app-paths"
import { scrollToHash } from "@/lib/smooth-scroll"

/* -------------------------------------------------------------------------- */
/* Page transition: a shutter that opens from the click, then lifts            */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "cover" | "wait" | "reveal"
type State = { phase: Phase; x: number; y: number; label: string; target: string }

type Navigate = (href: string, origin?: { x: number; y: number }, label?: string) => void

const TransitionContext = createContext<Navigate | null>(null)

const labels: Record<string, string> = {
  "/": "Framesly",
  "/signup": "Start free",
  "/login": "Log in",
  "/sample": "Sample gallery",
  "/pricing": "Pricing",
  "/video": "Video",
  "/legal/terms": "Terms",
  "/legal/privacy": "Privacy",
}

const shutter = [0.7, 0, 0.2, 1] as const
const curtain = [0.76, 0, 0.24, 1] as const

/**
 * Wraps the whole app (root layout, so it survives every route change).
 *
 * 1. cover:  an espresso shutter opens as a circle from the click point.
 * 2. wait:   the route changes underneath (pages are prefetched by <Link>).
 * 3. reveal: the shutter lifts like a curtain with a marigold edge while
 *            the new page rises into place.
 *
 * Works in every browser (no View Transitions API dependency). Skipped for
 * reduced motion, modified clicks, external links, same-page anchors and any
 * navigation that starts inside the photographer's app.
 */
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const reduce = useReducedMotion() ?? false
  const [state, setState] = useState<State>({ phase: "idle", x: 0, y: 0, label: "", target: "" })
  const hrefRef = useRef("")

  // The new route has committed: give it one frame to paint, then lift the curtain.
  const onArrive = useCallback(() => setState((s) => (s.phase === "wait" ? { ...s, phase: "reveal" } : s)), [])

  const navigate = useCallback<Navigate>(
    (href, origin, label) => {
      const url = new URL(href, window.location.href)
      const samePage = url.pathname === window.location.pathname

      // Same page: glide to the section (or the top) instead of jumping.
      if (samePage) {
        if (scrollToHash(url.hash)) {
          if (url.hash) window.history.pushState(null, "", url.hash)
          return
        }
        router.push(href)
        return
      }
      // The curtain is for the marketing site and auth. Inside the app, people
      // navigate all day, so moving between app pages is instant.
      if (reduce || url.origin !== window.location.origin || isAppPath(window.location.pathname)) {
        router.push(href)
        return
      }
      hrefRef.current = url.pathname + url.search + url.hash
      router.prefetch(url.pathname)
      setState({
        phase: "cover",
        x: origin?.x ?? window.innerWidth / 2,
        y: origin?.y ?? window.innerHeight / 2,
        label: label ?? labels[url.pathname] ?? "Framesly",
        target: url.pathname,
      })
    },
    [reduce, router]
  )

  // Let the new page rise into place while the curtain lifts.
  useEffect(() => {
    const body = document.body
    if (state.phase === "reveal") body.dataset.revealing = "true"
    else delete body.dataset.revealing
    document.documentElement.style.overflow = state.phase === "cover" || state.phase === "wait" ? "hidden" : ""
  }, [state.phase])

  // Safety net: if navigation never lands (offline, error), never trap the user.
  useEffect(() => {
    if (state.phase !== "wait") return
    const t = setTimeout(() => setState((s) => ({ ...s, phase: "reveal" })), 6000)
    return () => clearTimeout(t)
  }, [state.phase])

  const { phase, x, y, label } = state
  const full = `circle(150vmax at ${x}px ${y}px)`

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      {state.phase === "wait" && (
        // Reading the URL is runtime data; inside Suspense it doesn't block prerendering.
        <Suspense fallback={null}>
          <ArrivalWatcher target={state.target} onArrive={onArrive} />
        </Suspense>
      )}
      {phase !== "idle" && (
        <motion.div
          data-pt-overlay
          aria-hidden={phase === "reveal"}
          role="status"
          aria-live="polite"
          className="grain fixed inset-0 z-(--z-transition) flex flex-col items-center justify-center bg-surface-sunken"
          initial={{ clipPath: `circle(0px at ${x}px ${y}px)`, y: "0%" }}
          animate={
            phase === "reveal"
              ? { clipPath: full, y: "-100%", transition: { duration: 0.75, ease: curtain } }
              : { clipPath: full, y: "0%", transition: { duration: 0.55, ease: shutter } }
          }
          onAnimationComplete={() => {
            if (phase === "cover") {
              setState((s) => ({ ...s, phase: "wait" }))
              router.push(hrefRef.current)
            } else if (phase === "reveal") {
              setState((s) => ({ ...s, phase: "idle" }))
            }
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 16 }}
            animate={phase === "reveal" ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }}
            transition={{ delay: phase === "cover" ? 0.22 : 0, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Wordmark className="scale-125" />
            <div className="flex items-center gap-3">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-safelight" />
                <span className="relative size-1.5 rounded-full bg-safelight" />
              </span>
              <span className="type-label text-ink-muted">Opening · {label}</span>
            </div>
          </motion.div>
          {/* The curtain's marigold edge, seen as it lifts */}
          <span className="absolute inset-x-0 bottom-0 h-1 bg-safelight" />
        </motion.div>
      )}
    </TransitionContext.Provider>
  )
}

/**
 * Fires once the route we are heading to has committed. Checked after commit
 * (not during render): navigation renders can be prepared and discarded
 * before the new page actually lands.
 */
function ArrivalWatcher({ target, onArrive }: { target: string; onArrive: () => void }) {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname !== target) return
    const raf = requestAnimationFrame(onArrive)
    return () => cancelAnimationFrame(raf)
  }, [pathname, target, onArrive])
  return null
}

export function usePageTransition() {
  return useContext(TransitionContext)
}

/** Should this click run the page transition instead of a plain navigation? */
export function shouldTransition(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (e.defaultPrevented || e.button !== 0) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  const internal = (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#")
  if (!internal) return false
  const target = e.currentTarget.getAttribute("target")
  if (target && target !== "_self") return false
  return true
}

/** Where the shutter opens from: the pointer, or the element's centre for keyboard clicks. */
export function clickOrigin(e: MouseEvent<HTMLElement>) {
  if (e.clientX || e.clientY) return { x: e.clientX, y: e.clientY }
  const r = e.currentTarget.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** A <Link> that navigates through the page transition. */
export function TransitionLink({ href, onClick, transitionLabel, ...props }: ComponentProps<typeof Link> & { transitionLabel?: string }) {
  const navigate = usePageTransition()
  const path = typeof href === "string" ? href : href.pathname ?? "/"
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (!navigate || !shouldTransition(e, path)) return
        e.preventDefault()
        navigate(path, clickOrigin(e), transitionLabel)
      }}
      {...props}
    />
  )
}
