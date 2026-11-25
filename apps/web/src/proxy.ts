import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"]
/** Anonymous visitor id for client gallery favourites (read in lib/data/client-gallery.ts). */
const VISITOR_COOKIE = "fv"

/**
 * Runs before the app and auth pages (Next.js 16 "proxy", formerly middleware):
 * - refreshes the Supabase session cookie
 * - signed out + /app/* or /reset-password → /login?next=<where they were going>
 * - signed in + login/signup → /app
 *
 * This is an optimistic check for fast redirects. Real access control is RLS
 * in the database plus requireUser() in every server action and page.
 * Marketing pages and client galleries aren't matched, so they stay static.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Client galleries: no Supabase session at all. Just make sure this browser
  // has its anonymous visitor id before the couple hearts anything, so quick
  // taps can't create several ids.
  if (pathname.startsWith("/g/")) {
    const response = NextResponse.next()
    if (!request.cookies.get(VISITOR_COOKIE)) {
      response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
      })
    }
    return response
  }

  const { response, signedIn } = await updateSession(request)

  const needsSession = pathname === "/app" || pathname.startsWith("/app/") || pathname === "/reset-password"
  if (needsSession && !signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return withCookies(NextResponse.redirect(url), response)
  }
  if (signedIn && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    url.search = ""
    return withCookies(NextResponse.redirect(url), response)
  }
  return response
}

/** Keep any refreshed session cookies when redirecting. */
function withCookies(redirect: NextResponse, from: NextResponse) {
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c))
  return redirect
}

export const config = {
  // The upload routes are listed so a long upload session keeps its token fresh.
  matcher: ["/app", "/app/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/api/uploads/:path*", "/api/photos", "/api/galleries/:path*", "/g/:path*"],
}
