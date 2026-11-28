"use server"

import { revalidatePath } from "next/cache"

import { formValues, type ActionState } from "@/lib/action-state"
import { requireUser } from "@/lib/auth/dal"
import { STUDIO_ASSETS_BUCKET } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import { fieldErrors, profileSchema } from "@/lib/validation"

/** The photographer's own profile (their name, shown to teammates later). */
export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["fullName"])
  const user = await requireUser("/profile")
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const [profile, auth] = await Promise.all([
    supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id),
    supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } }),
  ])
  const error = profile.error ?? auth.error
  if (error) return { status: "error", message: error.message, values }
  revalidatePath("/", "layout")
  return { status: "success", message: "Profile saved.", values }
}

/**
 * Save (or clear) the profile photo after the browser has uploaded it.
 * Only accepts a path inside the user's own folder, and removes the old file.
 */
export async function setAvatarAction(path: string | null): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser("/profile")
  if (path !== null && !path.startsWith(`users/${user.id}/avatar/`)) return { ok: false, message: "That file isn't yours." }

  const supabase = await createClient()
  const { data: current } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle()
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id)
  if (error) return { ok: false, message: error.message }

  const old = current?.avatar_path
  if (old && old !== path) await supabase.storage.from(STUDIO_ASSETS_BUCKET).remove([old])
  revalidatePath("/", "layout")
  return { ok: true }
}
