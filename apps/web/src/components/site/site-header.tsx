"use client"

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { useSignedIn } from "@/components/site/use-signed-in"
import { Wordmark } from "@/components/site/wordmark"
import { TransitionLink as Link } from "@/components/transition/page-transition"
import { ButtonLink, buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { marketingNav } from "@/lib/site"
import { cn } from "@/lib/utils"

/**
 * Transparent over the hero. Once scrolled it gets the raised background and
 * a bottom border. The header's "Start free" is a secondary button: each
 * section already has its own safelight button, and a screen has only one.
 *
 * Signed-in photographers get "Dashboard" and "Log out" instead of "Log in"
 * and "Start free". Until the session is known the signed-out buttons hold
 * their place invisibly, so nothing jumps or flashes.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { signedIn, signOut } = useSignedIn()
  const [signingOut, setSigningOut] = useState(false)
  const logOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      setOpen(false)
    } finally {
      setSigningOut(false)
    }
  }

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8))

  // Close the mobile menu after navigating (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-(--z-header) border-b transition-[background-color,border-color] duration-300",
          open ? "border-line bg-surface-overlay" : scrolled ? "border-line bg-surface-raised" : "border-transparent bg-transparent"
        )}
      >
        <div className="gutter mx-auto flex h-16 max-w-[var(--container-content)] items-center gap-8">
          <Link href="/" aria-label="Framesly home" className="shrink-0 rounded-[var(--radius-chip)]">
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
            {marketingNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center rounded-[var(--radius-chip)] px-3 type-caption transition-colors",
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 bottom-2 h-px bg-safelight"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <>
                <button
                  type="button"
                  onClick={logOut}
                  disabled={signingOut}
                  className="hidden h-11 items-center rounded-[var(--radius-chip)] px-3 type-caption text-ink-muted transition-colors hover:text-ink disabled:opacity-60 sm:flex"
                >
                  {signingOut ? "Logging out…" : "Log out"}
                </button>
                <ButtonLink href="/galleries" data-cta="header-dashboard" size="sm" variant="secondary" className="hidden sm:inline-flex">
                  Dashboard
                </ButtonLink>
                {/* Phones: an icon keeps the bar within the screen. The menu lists Dashboard too (the only place on very narrow screens). */}
                <ButtonLink href="/galleries" aria-label="Dashboard" size="icon" variant="secondary" className="sm:hidden max-[359px]:hidden">
                  <Icon name="images" />
                </ButtonLink>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "hidden h-11 items-center rounded-[var(--radius-chip)] px-3 type-caption text-ink-muted transition-colors hover:text-ink sm:flex",
                    signedIn === null && "invisible"
                  )}
                >
                  Log in
                </Link>
                <ButtonLink
                  href="/signup"
                  data-cta="header-start-free"
                  size="sm"
                  variant="secondary"
                  className={cn("hidden sm:inline-flex", signedIn === null && "invisible")}
                >
                  Start free
                </ButtonLink>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "md:hidden")}
            >
              <span className="relative block h-3 w-5" aria-hidden>
                <span
                  className={cn(
                    "absolute left-0 h-0.5 w-5 bg-current transition-[top,rotate] duration-300",
                    open ? "top-[5px] rotate-45" : "top-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-0.5 w-5 bg-current transition-[top,rotate] duration-300",
                    open ? "top-[5px] -rotate-45" : "top-[10px]"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 top-16 bottom-0 z-(--z-nav) flex flex-col bg-surface-overlay md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
          >
            <nav aria-label="Mobile" className="gutter flex flex-1 flex-col pt-6">
              {[...marketingNav, signedIn ? { href: "/galleries", label: "Dashboard" } : { href: "/login", label: "Log in" }].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-line"
                >
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex items-baseline justify-between py-4">
                    <span className="type-heading-1">{item.label}</span>
                    <span className="type-label text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="gutter space-y-3 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
              {signedIn ? (
                <button
                  type="button"
                  onClick={logOut}
                  disabled={signingOut}
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}
                >
                  {signingOut ? "Logging out…" : "Log out"}
                </button>
              ) : (
                <ButtonLink href="/signup" size="lg" className="w-full" onClick={() => setOpen(false)}>
                  Start free
                </ButtonLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
