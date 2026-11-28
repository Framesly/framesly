/**
 * Top-level addresses of the photographer's app (signed-in pages).
 * The proxy matcher in proxy.ts lists the same paths as literals, because
 * Next.js reads that config statically; keep the two in sync.
 */
export const APP_SECTIONS = ["/galleries", "/uploads", "/studio", "/profile", "/onboarding"] as const

/** True for any page of the photographer's app. */
export function isAppPath(pathname: string) {
  return APP_SECTIONS.some((s) => pathname === s || pathname.startsWith(`${s}/`))
}
