"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import { cn } from "@/lib/utils"

const items = [
  {
    href: "/app",
    label: "Galleries",
    icon: <path d="M3.5 5.5h13v9h-13zM3.5 11l3.5-3 3 2.5 2-1.5 4.5 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  },
  {
    href: "/app/upload",
    label: "Uploads",
    icon: <path d="M10 13.5V4m0 0L6.5 7.5M10 4l3.5 3.5M4 15.5h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    href: "/app/settings/studio",
    label: "Studio",
    icon: <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM16 10l1.5-.8-1-2.4-1.7.4-1-1-.4-1.7-2.4-1L10 4l-.8-1.5-2.4 1 .4 1.7-1 1-1.7-.4-1 2.4L4 10l-1.5.8 1 2.4 1.7-.4 1 1-.4 1.7 2.4 1L10 16l.8 1.5 2.4-1-.4-1.7 1-1 1.7.4 1-2.4Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  },
  {
    href: "/app/settings/profile",
    label: "Profile",
    icon: <path d="M10 10a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 10 10Zm-6 6.5c.7-2.8 3.1-4.5 6-4.5s5.3 1.7 6 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  },
]

type Variant = "sidebar" | "tabs"

/**
 * App navigation: sidebar on desktop, bottom tab bar on phones.
 * The links are part of the static shell; the active highlight needs the URL
 * (runtime data), so it streams in under Suspense with no layout shift.
 */
export function AppNav({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={<NavLinks variant={variant} pathname={null} />}>
      <ActiveNav variant={variant} />
    </Suspense>
  )
}

function ActiveNav({ variant }: { variant: Variant }) {
  return <NavLinks variant={variant} pathname={usePathname()} />
}

function NavLinks({ variant, pathname }: { variant: Variant; pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null &&
    (href === "/app" ? pathname === "/app" || pathname.startsWith("/app/galleries") : pathname.startsWith(href))

  if (variant === "sidebar") {
    return (
      <nav aria-label="App" className="flex flex-col gap-1 px-3 pt-2">
        {items.map((it) => {
          const on = isActive(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 type-caption transition-colors",
                on ? "text-ink" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
              )}
            >
              {on && <motion.span layoutId="app-nav-active" className="absolute inset-0 rounded-[var(--radius-control)] border border-line bg-surface-raised" />}
              <svg viewBox="0 0 20 20" className="relative size-5" aria-hidden>{it.icon}</svg>
              <span className="relative">{it.label}</span>
              {on && <span aria-hidden className="relative ml-auto size-1.5 rounded-full bg-safelight" />}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((it) => {
        const on = isActive(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={cn("relative flex h-16 flex-1 flex-col items-center justify-center gap-1 type-label text-[10px]", on ? "text-ink" : "text-ink-muted")}
          >
            {on && <motion.span layoutId="app-tab-active" className="absolute inset-x-6 top-0 h-0.5 bg-safelight" />}
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden>{it.icon}</svg>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
