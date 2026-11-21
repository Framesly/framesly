"use client"

import type { ImageLoaderProps } from "next/image"

/** Widths stored for every site photo (site-media/showcase/name-400.webp … name-1800.webp). */
export const PHOTO_WIDTHS = [400, 800, 1200, 1800] as const

/**
 * Global next/image loader. Images are served at pre-made sizes instead of
 * through Vercel's optimiser, which bills per image and would get expensive
 * with thousands of wedding photos per gallery.
 *
 * - Site photos in Supabase Storage (…/site-media/showcase/name.webp): the
 *   smallest stored width that covers the requested width.
 * - Production photos (R2 + Cloudflare): add the Cloudflare Image Resizing
 *   branch here once the CDN hostname is known.
 * - Anything else: served as-is.
 */
export default function frameslyImageLoader({ src, width }: ImageLoaderProps) {
  if (src.includes("/site-media/showcase/") && src.endsWith(".webp")) {
    const w = PHOTO_WIDTHS.find((size) => size >= width) ?? PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1]
    return `${src.slice(0, -".webp".length)}-${w}.webp`
  }
  return src
}
