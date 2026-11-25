import "server-only"

import { createHmac } from "node:crypto"

/*
 * Signed, expiring photo links served by the media Worker (workers/media).
 * Server-only: MEDIA_TOKEN_SECRET never reaches the browser.
 *
 *   <NEXT_PUBLIC_MEDIA_URL>/galleries/<galleryId>/<web|original>/<photoId>.<ext>?exp=<unix>&sig=<hmac>
 *   sig = base64url(HMAC-SHA256(MEDIA_TOKEN_SECRET, `${path}:${exp}`))
 */

export const MEDIA_URL_TTL = 60 * 60 // 1 hour; the client page refreshes links before then

/** The media Worker's domain (workers/media/wrangler.toml), used when NEXT_PUBLIC_MEDIA_URL is unset. */
const DEFAULT_MEDIA_URL = "https://media.framesly.app"

/** NEXT_PUBLIC_MEDIA_URL as an origin; accepts a bare host such as "media.framesly.app". */
function mediaBase() {
  const raw = process.env.NEXT_PUBLIC_MEDIA_URL?.trim() || DEFAULT_MEDIA_URL
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

export function signMediaUrl(key: string, ttlSeconds = MEDIA_URL_TTL, options: { download?: boolean; name?: string } = {}) {
  const secret = process.env.MEDIA_TOKEN_SECRET
  if (!secret) throw new Error("Media links aren't configured. Set MEDIA_TOKEN_SECRET.")
  const base = mediaBase()

  const path = `/${key.replace(/^\/+/, "")}`
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = createHmac("sha256", secret).update(`${path}:${exp}`).digest("base64url")
  const url = new URL(path, base)
  url.searchParams.set("exp", String(exp))
  url.searchParams.set("sig", sig)
  if (options.download) {
    url.searchParams.set("download", "1")
    if (options.name) url.searchParams.set("name", options.name)
  }
  return url.toString()
}
