import type { Metadata } from "next"
import { Suspense } from "react"

import { AppNav } from "@/components/app/app-nav"
import { PageSkeleton } from "@/components/app/page-skeleton"
import { StudioBadge, StudioBadgeSkeleton } from "@/components/app/studio-badge"
import { Wordmark } from "@/components/site/wordmark"
import { TransitionLink } from "@/components/transition/page-transition"
import { SkipLink } from "@/components/ui/skip-link"
import { ToastProvider } from "@/components/ui/toast"
import { signOutAction } from "@/features/auth/actions"
import { requireStudio } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Framesly" },
  robots: { index: false, follow: false },
}

/**
 * The photographer's app after login.
 *
 * The chrome (sidebar, tabs, header frame) is static and renders instantly.
 * Everything that reads the session streams in behind Suspense, as Cache
 * Components requires (next/docs: authentication-with-cache-components).
 * <StudioGate> sends signed-out users to /login and new users to onboarding.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SkipLink />
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface-sunken lg:flex">
          <div className="flex h-16 items-center px-5">
            <TransitionLink href="/" aria-label="Framesly home">
              <Wordmark />
            </TransitionLink>
          </div>
          <AppNav variant="sidebar" />
          <div className="mt-auto space-y-4 border-t border-line p-5">
            <form action={signOutAction}>
              <button type="submit" className="flex h-11 w-full items-center rounded-[var(--radius-control)] px-3 type-caption text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-(--z-sticky) flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<StudioBadgeSkeleton />}>
              <StudioBadge />
            </Suspense>
            <div className="flex items-center gap-2 lg:hidden">
              <form action={signOutAction}>
                <button type="submit" className="flex h-11 items-center rounded-[var(--radius-chip)] px-3 type-caption text-ink-muted hover:text-ink">
                  Log out
                </button>
              </form>
            </div>
          </header>

          <main id="main" className="flex-1 px-4 pt-8 pb-28 sm:px-6 lg:px-8 lg:pb-12">
            <Suspense fallback={<PageSkeleton />}>
              <StudioGate>{children}</StudioGate>
            </Suspense>
          </main>
        </div>

        <AppNav variant="tabs" />
      </div>
    </ToastProvider>
  )
}

/** Signed in and onboarded, or redirected. Deduplicated per request (React.cache). */
async function StudioGate({ children }: { children: React.ReactNode }) {
  await requireStudio()
  return <>{children}</>
}
