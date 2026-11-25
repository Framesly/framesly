import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { supabaseUrl } from "./env"

/**
 * Service-role client: bypasses RLS. Server-only, and only for the client
 * gallery routes (couples have no Supabase account). Every caller must check
 * published / expiry / password itself before returning anything.
 * Never import this from a client component or a "use client" file.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server only).")
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
