import "server-only"

import { cache } from "react"

import { presignGet } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

/*
 * Gallery reads for the dashboard. Callers pass the studio id they got from
 * requireStudio(); RLS also limits rows to the signed-in member's studios.
 */

export const listGalleries = cache(async (studioId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gallery_overview")
    .select("*")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
})

/** One gallery with its sections, fetched in parallel (async-parallel). */
export const getGalleryWithSections = cache(async (galleryId: string) => {
  const supabase = await createClient()
  const [gallery, sections] = await Promise.all([
    supabase.from("gallery_overview").select("*").eq("id", galleryId).maybeSingle(),
    supabase.from("sections").select("id, name, sort_order").eq("gallery_id", galleryId).order("sort_order"),
  ])
  if (!gallery.data) return null
  return { gallery: gallery.data, sections: sections.data ?? [] }
})

/**
 * A short-lived photo URL for each gallery's dashboard card: the chosen cover,
 * else the first ready photo (same order the client gallery uses). Galleries
 * without photos are left out so the card shows its placeholder. One small
 * query per gallery, run in parallel; signing is local, so no extra network.
 */
export async function listGalleryCovers(galleries: { id: string; cover_photo_id: string | null; photo_count: number }[]) {
  const supabase = await createClient()
  const entries = await Promise.all(
    galleries
      .filter((g) => g.photo_count > 0)
      .map(async (g) => {
        let key: string | null = null
        if (g.cover_photo_id) {
          const { data } = await supabase.from("photos").select("web_key").eq("id", g.cover_photo_id).eq("status", "ready").maybeSingle()
          key = data?.web_key ?? null
        }
        if (!key) {
          const { data } = await supabase
            .from("photos")
            .select("web_key")
            .eq("gallery_id", g.id)
            .eq("status", "ready")
            .not("web_key", "is", null)
            .order("taken_at", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
          key = data?.web_key ?? null
        }
        return [g.id, key ? await presignGet(key) : null] as const
      })
  )
  return new Map(entries.filter((e): e is readonly [string, string] => e[1] !== null))
}

export const PHOTO_PAGE_SIZE = 96

/** Postgres "undefined column": the photo sort_order migration has not been applied yet. */
const isMissingColumn = (error: { code?: string } | null) => error?.code === "42703"

/**
 * One page of a gallery's photos in display order: the photographer's order
 * first, then capture time, then upload time. RLS limits this to the signed-in
 * member's studio. Falls back to the old order until the sort_order migration exists.
 */
export async function listGalleryPhotos(galleryId: string, offset = 0, limit = PHOTO_PAGE_SIZE) {
  const supabase = await createClient()
  const query = (sorted: boolean) => {
    let q = supabase.from("photos").select("id, original_name, web_key, status, section_id").eq("gallery_id", galleryId)
    if (sorted) q = q.order("sort_order", { ascending: true, nullsFirst: false })
    return q.order("taken_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).order("id").range(offset, offset + limit - 1)
  }
  let { data, error } = await query(true)
  if (isMissingColumn(error)) ({ data, error } = await query(false))
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Every photo id of a gallery in display order (read in pages of 1,000, the API's row limit). */
export async function listGalleryPhotoIds(galleryId: string) {
  const supabase = await createClient()
  const ids: string[] = []
  for (let from = 0; ; from += 1000) {
    const query = (sorted: boolean) => {
      let q = supabase.from("photos").select("id").eq("gallery_id", galleryId)
      if (sorted) q = q.order("sort_order", { ascending: true, nullsFirst: false })
      return q.order("taken_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }).order("id").range(from, from + 999)
    }
    let { data, error } = await query(true)
    if (isMissingColumn(error)) ({ data, error } = await query(false))
    if (error) throw new Error(error.message)
    ids.push(...(data ?? []).map((r) => r.id))
    if ((data?.length ?? 0) < 1000) return ids
  }
}

/** Publishing state of one gallery (link name, published, expiry, password set). */
export const getPublishState = cache(async (galleryId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("galleries")
    .select("public_slug, published_at, expires_at, has_password")
    .eq("id", galleryId)
    .maybeSingle()
  return data
})
