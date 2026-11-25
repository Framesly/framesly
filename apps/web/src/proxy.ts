import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"]

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
  const { response, signedIn } = await updateSession(request)
  const { pathname, search } = request.nextUrl

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
  matcher: ["/app", "/app/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/api/uploads/:path*", "/api/photos", "/api/galleries/:path*"],
}
