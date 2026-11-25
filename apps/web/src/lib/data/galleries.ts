import "server-only"

import { cache } from "react"

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

export const PHOTO_PAGE_SIZE = 48

/** Newest photos of a gallery (RLS limits this to the signed-in member's studio). */
export const listGalleryPhotos = cache(async (galleryId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("photos")
    .select("id, original_name, web_key, width, height, status")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false })
    .limit(PHOTO_PAGE_SIZE)
  if (error) throw new Error(error.message)
  return data ?? []
})

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
