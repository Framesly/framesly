"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const items = [
  { href: "/app", label: "Galleries", icon: "images" },
  { href: "/app/upload", label: "Uploads", icon: "upload" },
  { href: "/app/settings/studio", label: "Studio", icon: "settings" },
  { href: "/app/settings/profile", label: "Profile", icon: "user" },
] as const

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
              <Icon name={it.icon} className="relative" />
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
      className="fixed inset-x-0 bottom-0 z-(--z-nav) flex border-t border-line bg-surface-raised/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {items.map((it) => {
        const on = isActive(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex h-16 flex-1 touch-manipulation flex-col items-center justify-center gap-1 text-micro leading-none font-medium transition-colors",
              on ? "text-ink" : "text-ink-muted active:text-ink"
            )}
          >
            {on && <motion.span layoutId="app-tab-active" className="absolute inset-x-[30%] top-0 h-0.5 rounded-full bg-safelight" />}
            <Icon name={it.icon} className={cn("size-[22px]", on && "text-safelight")} />
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
