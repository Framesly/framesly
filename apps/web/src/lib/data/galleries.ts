import "server-only"

import { cache } from "react"

import { decryptGalleryKey } from "@/lib/gallery-key"
import { photoImageUrls } from "@/lib/media"
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
 * The cover image for each gallery's dashboard card: the chosen cover, else
 * the first ready photo (the order the client gallery uses). Galleries
 * without photos are left out so the card shows its placeholder.
 *
 * Chosen covers come back in one query; only galleries without one (or whose
 * cover is no longer ready) need their own "first photo" query, run in
 * parallel. Links are signed media thumbnails that stay cacheable.
 */
export async function listGalleryCovers(galleries: { id: string; cover_photo_id: string | null; photo_count: number }[]) {
  const supabase = await createClient()
  const withPhotos = galleries.filter((g) => g.photo_count > 0)
  const coverIds = withPhotos.map((g) => g.cover_photo_id).filter((id): id is string => Boolean(id))
  const { data: chosen } = coverIds.length
    ? await supabase.from("photos").select("id, gallery_id, web_key").in("id", coverIds).eq("status", "ready").not("web_key", "is", null)
    : { data: [] as { id: string; gallery_id: string; web_key: string | null }[] }
  const keys = new Map((chosen ?? []).map((p) => [p.gallery_id, p.web_key as string]))

  await Promise.all(
    withPhotos
      .filter((g) => !keys.has(g.id))
      .map(async (g) => {
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
        if (data?.web_key) keys.set(g.id, data.web_key)
      })
  )
  return new Map([...keys].map(([id, key]) => [id, photoImageUrls(key)] as const))
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

/**
 * Publishing state of one gallery (link name, published, expiry) plus its key
 * in plain text when one is set and readable. Keys set before keys were
 * stored encrypted come back as null with hasPassword true: a reset fixes that.
 */
export const getPublishState = cache(async (galleryId: string) => {
  const supabase = await createClient()
  const [{ data }, cipher] = await Promise.all([
    supabase.from("galleries").select("public_slug, published_at, expires_at, has_password, cover_mode").eq("id", galleryId).maybeSingle(),
    supabase.rpc("gallery_key_cipher", { p_gallery_id: galleryId }),
  ])
  if (!data) return null
  return { ...data, key: data.has_password ? decryptGalleryKey(cipher.data) : null }
})
