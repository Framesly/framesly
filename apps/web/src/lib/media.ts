import "server-only"

import { createHmac } from "node:crypto"

/*
 * Signed, expiring photo links served by the media Worker (workers/media).
 * Server-only: MEDIA_TOKEN_SECRET never reaches the browser.
 *
 *   <NEXT_PUBLIC_MEDIA_URL>/galleries/<galleryId>/<thumb|web|original>/<photoId>.<ext>?exp=<unix>&sig=<hmac>
 *   sig = base64url(HMAC-SHA256(MEDIA_TOKEN_SECRET, `${path}:${exp}`))
 *
 * Expiry is rounded up to a fixed step, so every page load within that step
 * signs the same URL: browsers and the Worker's edge cache can then reuse
 * the image instead of downloading it again.
 */

export const MEDIA_URL_TTL = 60 * 60 // at least 1 hour; the client page refreshes links before they end
const EXPIRY_STEP = 15 * 60

/** The media Worker's domain (workers/media/wrangler.toml), used when NEXT_PUBLIC_MEDIA_URL is unset. */
const DEFAULT_MEDIA_URL = "https://media.framesly.app"

/** NEXT_PUBLIC_MEDIA_URL as an origin; accepts a bare host such as "media.framesly.app". */
function mediaBase() {
  const raw = process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || DEFAULT_MEDIA_URL
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

/** When links signed now with this TTL expire (unix seconds): now + ttl, rounded up to the step. */
export function mediaExpiry(ttlSeconds = MEDIA_URL_TTL) {
  const at = Math.floor(Date.now() / 1000) + ttlSeconds
  return Math.ceil(at / EXPIRY_STEP) * EXPIRY_STEP
}

export function signMediaUrl(key: string, ttlSeconds = MEDIA_URL_TTL, options: { download?: boolean; name?: string } = {}) {
  const secret = process.env.MEDIA_TOKEN_SECRET
  if (!secret) throw new Error("Media links aren't configured. Set MEDIA_TOKEN_SECRET.")

  const path = `/${key.replace(/^\/+/, "")}`
  const exp = mediaExpiry(ttlSeconds)
  const sig = createHmac("sha256", secret).update(`${path}:${exp}`).digest("base64url")
  const url = new URL(path, mediaBase())
  url.searchParams.set("exp", String(exp))
  url.searchParams.set("sig", sig)
  if (options.download) {
    url.searchParams.set("download", "1")
    if (options.name) url.searchParams.set("name", options.name)
  }
  return url.toString()
}

/** The thumbnail's key for a photo's web copy (same folder layout, "thumb" instead of "web"). */
export const thumbKeyOf = (webKey: string) => webKey.replace("/web/", "/thumb/")

/** Signed links for showing a photo: the small thumbnail and the full web copy to fall back to. */
export function photoImageUrls(webKey: string) {
  return { thumb: signMediaUrl(thumbKeyOf(webKey)), full: signMediaUrl(webKey) }
}
