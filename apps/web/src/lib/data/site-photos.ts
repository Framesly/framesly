import "server-only"

import { createClient } from "@supabase/supabase-js"
import { cacheLife, cacheTag } from "next/cache"

import { SITE_PHOTO_KEYS, showcaseUrl, type SitePhotos } from "@/lib/photos"
import type { Database } from "@/lib/supabase/database.types"
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env"

/**
 * The site's photo catalogue from public.site_photos. Public data, read with
 * the anon key and no session, cached for hours so pages stay static. After
 * editing rows, revalidateTag("site-photos") or wait for the cache to expire.
 */
export async function getSitePhotos(): Promise<SitePhotos> {
  "use cache"
  cacheLife("hours")
  cacheTag("site-photos")

  if (!isSupabaseConfigured) {
    throw new Error("Site photos load from Supabase. Set NEXT_PUBLIC_SUPABASE_URL and the anon key (see SETUP.md).")
  }
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data, error } = await supabase
    .from("site_photos")
    .select("key, file, width, height, alt")
    .eq("is_active", true)
    .order("sort_order")
  if (error) throw new Error(`Couldn't load site photos: ${error.message}`)

  const byKey = new Map(data.map((row) => [row.key, row]))
  const missing = SITE_PHOTO_KEYS.filter((key) => !byKey.has(key))
  if (missing.length > 0) throw new Error(`site_photos has no active row for: ${missing.join(", ")}`)

  return Object.fromEntries(
    SITE_PHOTO_KEYS.map((key) => {
      const row = byKey.get(key)!
      return [key, { id: row.file, src: showcaseUrl(`${row.file}.webp`), w: row.width, h: row.height, alt: row.alt }]
    })
  ) as SitePhotos
}
