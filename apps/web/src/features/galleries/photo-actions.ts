"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireStudio } from "@/lib/auth/dal"
import { listGalleryPhotoIds, listGalleryPhotos, PHOTO_PAGE_SIZE } from "@/lib/data/galleries"
import { toGridPhotos, type GridPhoto } from "@/lib/data/grid-photos"
import { thumbKeyOf } from "@/lib/media"
import { deleteKeys } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

/*
 * Photo management in the gallery editor: cover, section, order, delete.
 * Each action re-checks the session and that the gallery belongs to the
 * caller's studio; RLS re-checks membership in the database as well.
 */

type Result = { ok: true } | { ok: false; message: string }

const ids = z.array(z.uuid()).min(1).max(500)

async function ownGallery(galleryId: string) {
  const { studio } = await requireStudio()
  if (!z.uuid().safeParse(galleryId).success) return null
  const supabase = await createClient()
  const { data } = await supabase.from("galleries").select("id, studio_id, cover_photo_id").eq("id", galleryId).maybeSingle()
  if (!data || data.studio_id !== studio.id) return null
  return { supabase, gallery: data }
}

/** The next page of the editor's photo grid. */
export async function loadMorePhotosAction(galleryId: string, offset: number): Promise<{ ok: true; photos: GridPhoto[]; done: boolean } | { ok: false; message: string }> {
  const own = await ownGallery(galleryId)
  if (!own) return { ok: false, message: "Gallery not found." }
  const rows = await listGalleryPhotos(galleryId, Math.max(0, Math.floor(offset)), PHOTO_PAGE_SIZE)
  return { ok: true, photos: toGridPhotos(rows), done: rows.length < PHOTO_PAGE_SIZE }
}

export async function setCoverAction(galleryId: string, photoId: string): Promise<Result> {
  const own = await ownGallery(galleryId)
  if (!own || !z.uuid().safeParse(photoId).success) return { ok: false, message: "Photo not found." }
  const { data: photo } = await own.supabase.from("photos").select("id").eq("id", photoId).eq("gallery_id", galleryId).eq("status", "ready").maybeSingle()
  if (!photo) return { ok: false, message: "Only finished photos can be the cover." }
  const { error } = await own.supabase.from("galleries").update({ cover_photo_id: photoId }).eq("id", galleryId)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  revalidatePath("/app")
  return { ok: true }
}

/** Put photos into a section, or take them out of every section (sectionId null). */
export async function assignSectionAction(galleryId: string, photoIds: string[], sectionId: string | null): Promise<Result> {
  const own = await ownGallery(galleryId)
  const parsed = ids.safeParse(photoIds)
  if (!own || !parsed.success) return { ok: false, message: "Photos not found." }
  if (sectionId !== null) {
    const { data: section } = await own.supabase.from("sections").select("id").eq("id", sectionId).eq("gallery_id", galleryId).maybeSingle()
    if (!section) return { ok: false, message: "Section not found." }
  }
  const { error } = await own.supabase.from("photos").update({ section_id: sectionId }).eq("gallery_id", galleryId).in("id", parsed.data)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}

/** Delete photos for good: the files on storage first (so nothing is orphaned), then the rows. */
export async function deletePhotosAction(galleryId: string, photoIds: string[]): Promise<Result> {
  const own = await ownGallery(galleryId)
  const parsed = ids.safeParse(photoIds)
  if (!own || !parsed.success) return { ok: false, message: "Photos not found." }
  const { data: rows } = await own.supabase.from("photos").select("id, r2_key, web_key").eq("gallery_id", galleryId).in("id", parsed.data)
  if (!rows?.length) return { ok: true }
  try {
    await deleteKeys(rows.flatMap((r) => [r.r2_key, ...(r.web_key ? [r.web_key, thumbKeyOf(r.web_key)] : [])]))
  } catch {
    return { ok: false, message: "Couldn't remove the files from storage. Nothing was deleted; try again." }
  }
  const { error } = await own.supabase.from("photos").delete().eq("gallery_id", galleryId).in("id", rows.map((r) => r.id))
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  revalidatePath("/app")
  return { ok: true }
}

/** Move one photo within the gallery's order. */
export async function movePhotoAction(galleryId: string, photoId: string, to: "start" | "earlier" | "later"): Promise<Result> {
  const own = await ownGallery(galleryId)
  if (!own || !z.uuid().safeParse(photoId).success) return { ok: false, message: "Photo not found." }
  const order = await listGalleryPhotoIds(galleryId)
  const from = order.indexOf(photoId)
  if (from < 0) return { ok: false, message: "Photo not found." }
  const target = to === "start" ? 0 : to === "earlier" ? from - 1 : from + 1
  if (target < 0 || target >= order.length) return { ok: true }
  order.splice(from, 1)
  order.splice(target, 0, photoId)
  const { error } = await own.supabase.rpc("reorder_photos", { p_gallery_id: galleryId, p_photo_ids: order })
  if (error) {
    const missing = error.code === "42883" || error.code === "PGRST202" || /reorder_photos/.test(error.message)
    return { ok: false, message: missing ? "Reordering needs the latest database update. Ask your developer to run the newest migration." : error.message }
  }
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}
