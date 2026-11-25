import { Wordmark } from "@/components/site/wordmark"
import { signOutAction } from "@/features/auth/actions"

/** Focused first-run layout: no app chrome until the studio exists. */
export default function OnboardingLayout({ children }: LayoutProps<"/app/onboarding">) {
  return (
    <div className="grain flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
        <Wordmark />
        <form action={signOutAction}>
          <button type="submit" className="flex h-11 items-center rounded-[var(--radius-chip)] px-3 type-caption text-ink-muted transition-colors hover:text-ink">
            Log out
          </button>
        </form>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-6 pb-16 sm:px-8 lg:pt-12">
        {children}
      </main>
    </div>
  )
}
