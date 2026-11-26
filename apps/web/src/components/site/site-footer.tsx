import { TransitionLink as Link } from "@/components/transition/page-transition"

import { ContactEmail, SocialLinks } from "@/components/site/social-links"
import { Wordmark } from "@/components/site/wordmark"
import { parentBrand } from "@/lib/site"

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/sample", label: "Sample gallery" },
      { href: "/video", label: "Video" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Start free" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
] as const

/** Plain-language summary of the Privacy policy. Keep it in step with app/(marketing)/legal/privacy. */
const promises = [
  {
    title: "Used only to run your galleries",
    body: "We store, process and deliver your photos and your clients' details only to provide Framesly to you: uploads, galleries, downloads and, when it launches, culling.",
  },
  {
    title: "Never sold, never for ads",
    body: "We don't sell your photos or data, show them to advertisers, or use them to train AI models unless you separately opt in.",
  },
  {
    title: "Private, and yours to remove",
    body: "Galleries open only through their private link and key. Delete a gallery and its photos are removed from our storage.",
  },
] as const

export function SiteFooter() {
  return (
    <footer className="grain overflow-hidden border-t border-line bg-surface-sunken">
      <div className="gutter mx-auto max-w-[var(--container-content)] pt-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-4 max-w-xs text-ink-muted">
              Upload a wedding once. Cull it, deliver it and keep it, from the same files.
            </p>
            <p className="mt-6 type-label text-ink-muted">Get in touch</p>
            <p className="mt-2 text-ink">
              <ContactEmail />
            </p>
            <SocialLinks className="-ml-3 mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="type-label text-ink-muted">{col.title}</p>
                <ul className="mt-4 space-y-1">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-11 items-center text-ink transition-colors hover:text-safelight-text"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <section aria-labelledby="footer-disclaimer" className="mt-14 border-t border-line pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div>
              <h2 id="footer-disclaimer" className="type-label text-ink-muted">Disclaimer</h2>
              <p className="mt-2 type-heading-2 text-ink">Your photos stay yours.</p>
            </div>
            <p className="type-caption font-normal text-ink-muted">
              The full details are in our{" "}
              <Link href="/legal/privacy" className="text-ink underline underline-offset-4 hover:text-safelight-text">Privacy policy</Link> and{" "}
              <Link href="/legal/terms" className="text-ink underline underline-offset-4 hover:text-safelight-text">Terms</Link>.
            </p>
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {promises.map((p) => (
              <li key={p.title}>
                <p className="type-caption text-ink">{p.title}</p>
                <p className="mt-1 type-caption font-normal text-pretty text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-2 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Static year: reading the clock here would make every page dynamic under Cache Components. */}
          <p className="type-label text-ink-muted">© 2026 Framesly · {parentBrand.tagline}</p>
          <p className="type-label text-ink-muted">Made for people who shoot the whole day</p>
        </div>
      </div>

      {/* Oversized outline wordmark, cropped by the page edge like a frame's rebate. */}
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.22em] text-center font-heading leading-none font-bold tracking-[-0.05em] text-transparent select-none"
        style={{ fontSize: "clamp(96px, 22vw, 320px)", WebkitTextStroke: "1px var(--line)" }}
      >
        Framesly
      </p>
    </footer>
  )
}
