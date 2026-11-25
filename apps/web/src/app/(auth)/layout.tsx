import { AuthShowcase } from "@/components/auth/auth-showcase"
import { ContactEmail } from "@/components/site/social-links"
import { Wordmark } from "@/components/site/wordmark"
import { ThemeArea, ThemeSwitch } from "@/components/theme/theme"
import { TransitionLink } from "@/components/transition/page-transition"
import { SkipLink } from "@/components/ui/skip-link"
import { parentBrand } from "@/lib/site"

/** Split layout: the form on the left, a live slideshow of culled picks on the right (desktop). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ThemeArea area="site">
      <SkipLink />
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="grain relative flex flex-col overflow-hidden px-4 py-6 sm:px-10 lg:px-16">
          {/* Soft marigold light behind the form */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-48 -left-40 size-[620px] rounded-full"
            style={{ background: "radial-gradient(closest-side, rgb(209 130 0 / 0.12), transparent)" }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <TransitionLink href="/" aria-label="Framesly home">
              <Wordmark />
            </TransitionLink>
            <ThemeSwitch id="auth" />
          </div>
          <main id="main" className="relative flex flex-1 items-center py-10">{children}</main>
          <p className="relative flex flex-wrap gap-x-4 gap-y-1 type-label text-ink-muted">
            <span>© 2026 Framesly · {parentBrand.tagline}</span>
            <span>
              Need help? <ContactEmail />
            </span>
          </p>
        </div>

        <div className="theme-espresso relative hidden p-4 lg:block">
          <AuthShowcase />
        </div>
      </div>
    </ThemeArea>
  )
}
