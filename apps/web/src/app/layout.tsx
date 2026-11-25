import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google"

import { MotionProvider } from "@/components/motion/motion-provider"
import { SitePhotosProvider } from "@/components/site/site-photos"
import { PageTransitionProvider } from "@/components/transition/page-transition"
import { getSitePhotos } from "@/lib/data/site-photos"
import { siteConfig } from "@/lib/site"
import "./globals.css"

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
})

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Framesly: cull, deliver and sell wedding photos from one upload",
    template: "%s · Framesly",
  },
  description: siteConfig.description,
  openGraph: { type: "website", siteName: siteConfig.name },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  // Darkroom --surface: the browser bar matches the page.
  themeColor: "#121417",
  colorScheme: "dark",
}

/** One-time clean-up of the old light/dark preference, which no longer exists. */
const clearOldThemeChoice = `try{localStorage.removeItem("framesly-theme")}catch(e){}`

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached public catalogue (site_photos), so pages still prerender as static.
  const photos = await getSitePhotos()
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${figtree.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: clearOldThemeChoice }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <MotionProvider>
          <SitePhotosProvider photos={photos}>
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </SitePhotosProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
