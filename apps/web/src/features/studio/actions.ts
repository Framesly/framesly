"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { formValues, type ActionState } from "@/lib/action-state"
import { getMembership, requireStudio, requireUser } from "@/lib/auth/dal"
import { STUDIO_ASSETS_BUCKET } from "@/lib/supabase/env"
import { LEGAL_VERSIONS } from "@/lib/legal"
import { createClient } from "@/lib/supabase/server"
import { createStudioSchema, fieldErrors, studioSlugSchema, updateStudioSchema } from "@/lib/validation"

export type SlugCheck = { available: boolean; message: string }

/** Live "is this address free?" check for onboarding and settings. */
export async function checkSlugAction(raw: string): Promise<SlugCheck> {
  await requireUser()
  const parsed = studioSlugSchema.safeParse(raw)
  if (!parsed.success) return { available: false, message: parsed.error.issues[0].message }

  // Your own current address counts as available in settings.
  const membership = await getMembership()
  if (membership?.studio.slug === parsed.data) return { available: true, message: "This is your current address." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("slug_available", { p_slug: parsed.data })
  if (error) return { available: false, message: "Couldn't check right now. Try again." }
  return data
    ? { available: true, message: "Available." }
    : { available: false, message: "That URL is taken. Try another." }
}

export type CreateStudioResult =
  | { ok: true; studioId: string }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> }

/**
 * Onboarding: record the photographer's agreement to the current Terms and
 * Privacy policy, then create the studio and owner membership in one
 * transaction. No studio is created without the agreement on record.
 */
export async function createStudioAction(input: {
  name: string
  slug: string
  brandColor: string
  region: string
  acceptedTerms: boolean
}): Promise<CreateStudioResult> {
  const user = await requireUser("/onboarding")
  if (input.acceptedTerms !== true) {
    return { ok: false, fieldErrors: { terms: "Please read and accept the Terms of service and Privacy policy to continue." } }
  }
  const parsed = createStudioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }

  const { name, slug, brandColor, region } = parsed.data
  const supabase = await createClient()

  const { error: acceptError } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    terms_version: LEGAL_VERSIONS.terms,
    privacy_version: LEGAL_VERSIONS.privacy,
    user_agent: (await headers()).get("user-agent")?.slice(0, 500) ?? null,
  })
  if (acceptError) return { ok: false, message: "Couldn't save your agreement. Try again." }

  const { data, error } = await supabase.rpc("create_studio", {
    p_name: name,
    p_slug: slug,
    p_region: region,
    p_brand_color: brandColor,
  })
  if (error) {
    if (error.code === "23505" && /slug/i.test(error.message + (error.details ?? ""))) {
      return { ok: false, fieldErrors: { slug: "That URL is taken. Try another." } }
    }
    if (error.code === "23505") return { ok: false, message: "You already have a studio. Opening your dashboard." }
    if (error.code === "23514") return { ok: false, fieldErrors: { slug: "That address isn't allowed. Try another." } }
    return { ok: false, message: error.message }
  }
  revalidatePath("/", "layout")
  return { ok: true, studioId: data.id }
}

/** Save (or clear) the logo after the browser uploaded it to Storage. */
export async function setStudioLogoAction(path: string | null): Promise<{ ok: boolean; message?: string }> {
  const { studio } = await requireStudio()
  if (path !== null && !path.startsWith(`studios/${studio.id}/logo/`)) {
    return { ok: false, message: "That file isn't in your studio's folder." }
  }
  const supabase = await createClient()
  const previous = studio.logo_path
  const { error } = await supabase.from("studios").update({ logo_path: path }).eq("id", studio.id)
  if (error) return { ok: false, message: error.message }
  if (previous && previous !== path) {
    await supabase.storage.from(STUDIO_ASSETS_BUCKET).remove([previous])
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Studio settings: name, address and brand colour. Owner only (RLS). */
export async function updateStudioAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["name", "slug", "brandColor"])
  const { studio, role } = await requireStudio()
  if (role !== "owner") return { status: "error", message: "Only the studio owner can change these settings.", values }

  const parsed = updateStudioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase
    .from("studios")
    .update({ name: parsed.data.name, slug: parsed.data.slug, brand_color: parsed.data.brandColor })
    .eq("id", studio.id)
  if (error) {
    if (error.code === "23505") return { status: "error", fieldErrors: { slug: "That URL is taken. Try another." }, values }
    return { status: "error", message: error.message, values }
  }
  revalidatePath("/", "layout")
  return { status: "success", message: "Studio saved.", values }
}
