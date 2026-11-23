import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * OAuth (Google) and PKCE email links land here with ?code=. Exchange it for
 * a session, then continue to ?next= (same-site paths only).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = sanitize(searchParams.get("next"))
  const plan = searchParams.get("plan")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Google sign-ups: remember which plan they picked on the pricing page.
      if (plan && ["solo", "studio", "collective"].includes(plan) && data.user) {
        await supabase.from("profiles").update({ plan_interest: plan as "solo" | "studio" | "collective" }).eq("id", data.user.id)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  // Google cancelled or blocked (e.g. app still in Testing), or the session
  // couldn't be finished (sign-in started on a different domain).
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}

function sanitize(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app"
}
