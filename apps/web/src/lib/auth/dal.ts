import "server-only"

import { redirect } from "next/navigation"
import { connection } from "next/server"
import { cache } from "react"

import type { MemberRole, Profile, Studio } from "@/lib/supabase/database.types"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

/*
 * Data Access Layer: the only place that reads the session. Each helper is
 * wrapped in React.cache so a request reads the session once, however many
 * components ask. Every page and server action authorises through these,
 * never through values sent from the browser.
 */

export type SessionUser = { id: string; email: string; fullName: string }

export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null
  // The Supabase client checks token expiry against the clock. Mark this as
  // request-time work so Next.js never tries to prerender it.
  await connection()
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: claims.sub,
    email: String(claims.email ?? ""),
    fullName: String(meta.full_name ?? meta.name ?? ""),
  }
})

export async function requireUser(next = "/app"): Promise<SessionUser> {
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export type Membership = { role: MemberRole; studio: Studio }

/** The signed-in user's studio (MVP: one studio per photographer). */
export const getMembership = cache(async (): Promise<Membership | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("studio_members")
    .select("role, studio:studios(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!data?.studio) return null
  return { role: data.role, studio: data.studio as unknown as Studio }
})

/** Signed in AND onboarded; otherwise redirect to login or onboarding. */
export async function requireStudio(): Promise<Membership & { user: SessionUser }> {
  const user = await requireUser()
  const membership = await getMembership()
  if (!membership) redirect("/app/onboarding")
  return { ...membership, user }
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return data
})
