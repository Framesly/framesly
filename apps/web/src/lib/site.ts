export const siteConfig = {
  name: "Framesly",
  description:
    "Upload a wedding once. Framesly culls it with AI, delivers a gallery in your brand and keeps every file in one place.",
  // Canonical origin for metadata, OG tags, sitemap and robots. Always the
  // launch domain, so previews on *.vercel.app never become canonical.
  url: "https://framesly.app",
} as const

/** Framesly is a product of Parvathy Studios; the contact details below are the company's. */
export const parentBrand = {
  name: "Parvathy Studios",
  tagline: "a Parvathy Studios SaaS",
} as const

export const contact = {
  email: "hello@parvathy.ai",
  social: [
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/parvathyai" },
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/parvathyai" },
    { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@parvathyai" },
    { id: "x", label: "X", href: "https://x.com/ParvathyAI" },
  ],
} as const

export type SocialId = (typeof contact.social)[number]["id"]

export const marketingNav = [
  { href: "/#how-it-works", label: "Product" },
  { href: "/video", label: "Video" },
  { href: "/pricing", label: "Pricing" },
  { href: "/sample", label: "Sample gallery" },
] as const

/**
 * Per-page canonical + Open Graph URL. A page that sets `openGraph` replaces
 * its parent's whole `openGraph` object, so the shared image is re-attached
 * here or link previews lose it.
 */
export function pageMeta(path: string) {
  return {
    alternates: { canonical: path },
    openGraph: { url: path, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Framesly: cull a wedding before dinner" }] },
  }
}
