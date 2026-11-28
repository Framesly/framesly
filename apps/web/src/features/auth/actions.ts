"use server"

import { redirect } from "next/navigation"

import { formValues, type ActionState } from "@/lib/action-state"
import { requireUser } from "@/lib/auth/dal"
import { safeNext, siteOrigin } from "@/lib/auth/redirects"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import { emailSchema, fieldErrors, passwordSchema, signInSchema, signUpSchema } from "@/lib/validation"

const NOT_CONFIGURED: ActionState = {
  status: "error",
  message: "Sign-in isn't connected yet. Add the Supabase keys to .env.local (see SETUP.md).",
}

/** Sign up with email + password. Sends a confirmation email unless confirmations are off. */
export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["fullName", "email", "plan"])
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }
  if (!isSupabaseConfigured) return { ...NOT_CONFIGURED, values }

  const { fullName, email, password, plan } = parsed.data
  const supabase = await createClient()
  const origin = await siteOrigin()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
      data: { full_name: fullName, ...(plan ? { plan } : {}) },
    },
  })

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return { status: "error", fieldErrors: { email: "An account with this email already exists. Log in instead." }, values }
    }
    if (error.code === "weak_password") {
      return { status: "error", fieldErrors: { password: error.message }, values }
    }
    return { status: "error", message: error.message, values }
  }

  // Email confirmations off (local dev): already signed in.
  if (data.session) redirect("/onboarding")
  return { status: "success", message: email, values }
}

/** Log in with email + password, then go where they were heading. */
export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["email"])
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }
  if (!isSupabaseConfigured) return { ...NOT_CONFIGURED, values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "Confirm your email first. We can send the link again.",
        fieldErrors: { unconfirmed: "1" },
        values,
      }
    }
    if (error.code === "invalid_credentials") {
      return { status: "error", message: "That email and password don't match. Try again or reset your password.", values }
    }
    return { status: "error", message: error.message, values }
  }
  redirect(safeNext(formData.get("next")))
}

/** Continue with Google (OAuth). Supabase sends them back to /auth/callback. */
export async function googleSignInAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=not-configured")
  const supabase = await createClient()
  const origin = await siteOrigin()
  const next = safeNext(formData.get("next"))
  const plan = formData.get("plan")
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}${typeof plan === "string" && plan ? `&plan=${plan}` : ""}`,
      queryParams: { prompt: "select_account" },
    },
  })
  if (error || !data.url) redirect("/login?error=oauth")
  redirect(data.url)
}

/** Send the confirmation email again. */
export async function resendConfirmationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED
  const email = emailSchema.safeParse(formData.get("email"))
  if (!email.success) return { status: "error", message: "Enter your email address first." }
  const supabase = await createClient()
  const origin = await siteOrigin()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/onboarding` },
  })
  if (error) return { status: "error", message: error.message }
  return { status: "success", message: "Sent. Check your inbox and spam folder." }
}

/** Email a password reset link. Same reply whether or not the account exists. */
export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["email"])
  const email = emailSchema.safeParse(formData.get("email"))
  if (!email.success) return { status: "error", fieldErrors: { email: email.error.issues[0].message }, values }
  if (!isSupabaseConfigured) return { ...NOT_CONFIGURED, values }
  const supabase = await createClient()
  const origin = await siteOrigin()
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/confirm?next=/reset-password` })
  return { status: "success", message: email.data, values }
}

/** Set a new password (from the reset link, or from profile settings). */
export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("/reset-password")
  const password = passwordSchema.safeParse(formData.get("password"))
  if (!password.success) return { status: "error", fieldErrors: { password: password.error.issues[0].message } }
  if (formData.get("confirm") !== formData.get("password")) {
    return { status: "error", fieldErrors: { confirm: "The two passwords don't match." } }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: password.data })
  if (error) {
    const msg = error.code === "same_password" ? "Choose a password you haven't used here before." : error.message
    return { status: "error", fieldErrors: { password: msg } }
  }
  if (formData.get("redirect") === "app") redirect("/galleries?password=updated")
  return { status: "success", message: "Password updated." }
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect("/login?signed-out=1")
}
