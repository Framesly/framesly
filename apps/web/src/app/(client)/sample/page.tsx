import type { Metadata } from "next"

import { ClientGallery } from "@/components/gallery/client-gallery"
import { sampleGalleryInfo as sampleGallery } from "@/components/gallery/gallery-data"

export const metadata: Metadata = {
  alternates: { canonical: "/sample" },
  title: `${sampleGallery.couple} · Sample gallery`,
  description: "A sample Framesly client gallery: what couples see when you deliver.",
  openGraph: {
    url: "/sample",
    title: `${sampleGallery.couple} · ${sampleGallery.studio.name}`,
    description: `${sampleGallery.place} · ${sampleGallery.dates}`,
    images: [{ url: sampleGallery.shareImage, width: 1200, height: 630, alt: "A couple seated in a red floral mandap" }],
  },
}

/**
 * Public demo of the client gallery (brief: /sample, static). It uses the
 * client gallery layout, with the photographer's brand instead of Framesly's.
 */
export default function SampleGalleryPage() {
  return <ClientGallery />
}
