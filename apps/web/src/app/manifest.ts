import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site"

/** Lets people add Framesly to their phone's home screen and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/galleries",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Darkroom --surface.
    background_color: "#121315",
    theme_color: "#121315",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512?maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
