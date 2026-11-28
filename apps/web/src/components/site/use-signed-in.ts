"use client"

import { useCallback, useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/env"

/**
 * Whether this browser has a Framesly session, for the public pages' header.
 * It is checked in the browser (the session cookie is read locally, no server
 * round trip) so marketing pages stay static. `null` until known.
 * This is only for showing the right buttons; the app pages check the session
 * on the server as always.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(isSupabaseConfigured ? null : false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    let live = true
    supabase.auth.getSession().then(({ data }) => live && setSignedIn(Boolean(data.session)))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)))
    return () => {
      live = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    setSignedIn(false)
  }, [])

  return { signedIn, signOut }
}
