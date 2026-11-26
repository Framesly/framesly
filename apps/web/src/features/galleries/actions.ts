"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { formValues, type ActionState } from "@/lib/action-state"
import { requireStudio } from "@/lib/auth/dal"
import { deleteGalleryObjects } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"
import { createGallerySchema, fieldErrors, sectionNameSchema, sectionPresets } from "@/lib/validation"

/*
 * Gallery mutations. Each action re-checks the session (requireStudio) and
 * RLS re-checks membership in the database, so a forged id can't reach
 * another studio's data.
 */

export async function createGalleryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["title", "eventDate", "preset", "customSections"])
  const { studio } = await requireStudio()
  const parsed = createGallerySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const { title, eventDate, preset, customSections } = parsed.data
  const sections =
    preset === "custom"
      ? (customSections ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 20)
      : [...sectionPresets[preset]]

  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc("create_gallery", {
    p_studio_id: studio.id,
    p_title: title,
    p_event_date: eventDate,
    p_sections: sections,
  })
  if (error || !id) return { status: "error", message: error?.message ?? "Couldn't create the gallery. Try again.", values }

  revalidatePath("/app")
  redirect(`/app/galleries/${id}?created=1`)
}

export async function updateGalleryAction(
  galleryId: string,
  input: { title?: string; eventDate?: string | null; status?: "draft" | "culling" | "delivered" | "archived"; coverMode?: "single" | "slideshow" }
) {
  await requireStudio()
  const title = input.title?.trim()
  if (title !== undefined && (title.length < 1 || title.length > 120)) return { ok: false, message: "Use 1 to 120 characters." }
  const supabase = await createClient()
  const { error } = await supabase
    .from("galleries")
    .update({
      ...(title !== undefined ? { title } : {}),
      ...(input.eventDate !== undefined ? { event_date: input.eventDate || null } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.coverMode === "single" || input.coverMode === "slideshow" ? { cover_mode: input.coverMode } : {}),
    })
    .eq("id", galleryId)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  revalidatePath("/app")
  return { ok: true }
}

export async function deleteGalleryAction(galleryId: string) {
  await requireStudio()
  const supabase = await createClient()
  // RLS only lets a member see their studio's galleries, so this also proves ownership
  // before anything is deleted from R2.
  const { data: gallery } = await supabase.from("galleries").select("id").eq("id", galleryId).maybeSingle()
  if (!gallery) return { ok: false, message: "Gallery not found." }
  try {
    await deleteGalleryObjects(galleryId)
  } catch {
    return { ok: false, message: "Couldn't remove the photos from storage. Nothing was deleted; try again." }
  }
  const { error } = await supabase.from("galleries").delete().eq("id", galleryId)
  if (error) return { ok: false, message: error.message }
  revalidatePath("/app")
  redirect("/app?deleted=1")
}

export async function addSectionAction(galleryId: string, name: string) {
  await requireStudio()
  const parsed = sectionNameSchema.safeParse(name)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { data: last } = await supabase
    .from("sections")
    .select("sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const { error } = await supabase.from("sections").insert({ gallery_id: galleryId, name: parsed.data, sort_order: (last?.sort_order ?? -1) + 1 })
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}

export async function renameSectionAction(galleryId: string, sectionId: string, name: string) {
  await requireStudio()
  const parsed = sectionNameSchema.safeParse(name)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.from("sections").update({ name: parsed.data }).eq("id", sectionId).eq("gallery_id", galleryId)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}

export async function deleteSectionAction(galleryId: string, sectionId: string) {
  await requireStudio()
  const supabase = await createClient()
  // Photos in the section are kept and become unsorted (section_id set null).
  const { error } = await supabase.from("sections").delete().eq("id", sectionId).eq("gallery_id", galleryId)
  if (error) return { ok: false, message: error.message }
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}

/** Move a section one place up or down by swapping sort orders. */
export async function moveSectionAction(galleryId: string, sectionId: string, direction: -1 | 1) {
  await requireStudio()
  const supabase = await createClient()
  const { data: sections } = await supabase.from("sections").select("id, sort_order").eq("gallery_id", galleryId).order("sort_order")
  if (!sections) return { ok: false }
  const i = sections.findIndex((s) => s.id === sectionId)
  const j = i + direction
  if (i < 0 || j < 0 || j >= sections.length) return { ok: true }
  const a = sections[i]
  const b = sections[j]
  await Promise.all([
    supabase.from("sections").update({ sort_order: j }).eq("id", a.id),
    supabase.from("sections").update({ sort_order: i }).eq("id", b.id),
  ])
  // Normalise any gaps so orders stay 0..n-1.
  await Promise.all(
    sections
      .map((s, k) => (k !== i && k !== j && s.sort_order !== k ? supabase.from("sections").update({ sort_order: k }).eq("id", s.id) : null))
      .filter(Boolean)
  )
  revalidatePath(`/app/galleries/${galleryId}`)
  return { ok: true }
}
