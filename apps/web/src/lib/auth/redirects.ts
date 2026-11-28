import "server-only"

import { headers } from "next/headers"

/** Only same-site paths are allowed as ?next= targets (no open redirects). */
export function safeNext(next: unknown, fallback = "/galleries") {
  if (typeof next !== "string") return fallback
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}

/**
 * Absolute origin for auth email and OAuth redirect links: the site the person
 * is actually on (framesly.app, framesly.vercel.app, a preview, localhost), so
 * they come back to the same place and keep their session cookie.
 * NEXT_PUBLIC_APP_URL is only a fallback when the request has no host.
 * Supabase still checks every redirect against its allow-list (config.toml).
 */
export async function siteOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (host) {
    const local = host.startsWith("localhost") || host.startsWith("127.")
    const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https")
    return `${proto}://${host}`
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
}
