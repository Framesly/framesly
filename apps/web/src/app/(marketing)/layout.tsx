import { CookieBanner } from "@/components/site/cookie-banner"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { SkipLink } from "@/components/ui/skip-link"

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
    </>
  )
}
