"use client"

import { motion } from "motion/react"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"

import { AuthBanner } from "@/components/auth/auth-showcase"
import { FormAlert, GoogleButton, item, OrDivider, PasswordField, stagger, SubmitButton } from "@/components/auth/primitives"
import { TransitionLink as Link } from "@/components/transition/page-transition"
import { Field } from "@/components/ui/field"
import { resendConfirmationAction, signInAction } from "@/features/auth/actions"
import { idle } from "@/lib/action-state"
import { isGoogleAuthEnabled } from "@/lib/supabase/env"

const linkErrors: Record<string, string> = {
  link: "That link has expired or was already used. Log in, or request a new one.",
  oauth: "Google sign-in didn't finish. Try again, or log in with email.",
  "not-configured": "Sign-in isn't connected yet. Add the Supabase keys (see SETUP.md).",
}

export function LoginForm() {
  const params = useSearchParams()
  const next = params.get("next") ?? "/app"
  const linkError = linkErrors[params.get("error") ?? ""]
  const signedOut = params.has("signed-out")
  const confirmed = params.has("confirmed")
  const [state, action] = useActionState(signInAction, idle)
  const [resendState, resend] = useActionState(resendConfirmationAction, idle)

  return (
    <motion.div className="w-full max-w-[420px]" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8 lg:hidden">
        <AuthBanner />
      </motion.div>
      <motion.h1 variants={item} className="type-heading-1 md:type-display-l">
        Welcome back
      </motion.h1>
      <motion.p variants={item} className="mt-3 text-ink-muted">
        Your galleries are where you left them.
      </motion.p>

      <div className="mt-6 space-y-3">
        {linkError && <FormAlert>{linkError}</FormAlert>}
        {signedOut && !linkError && <FormAlert tone="info">You’re signed out.</FormAlert>}
        {confirmed && !linkError && <FormAlert tone="success">Your email is confirmed. Log in to set up your studio.</FormAlert>}
      </div>

      {isGoogleAuthEnabled && (
        <>
          <motion.div variants={item} className="mt-6">
            <GoogleButton next={next} />
          </motion.div>
          <motion.div variants={item}>
            <OrDivider />
          </motion.div>
        </>
      )}

      <form action={action} className={isGoogleAuthEnabled ? "space-y-5" : "mt-8 space-y-5"} noValidate>
        <input type="hidden" name="next" value={next} />
        {state.message && state.status === "error" && <FormAlert>{state.message}</FormAlert>}
        <motion.div variants={item}>
          <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="you@studio.com…" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
        </motion.div>
        <motion.div variants={item}>
          <PasswordField label="Password" name="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="type-caption font-semibold text-safelight-text underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
        </motion.div>
        <motion.div variants={item}>
          <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
        </motion.div>
      </form>

      {state.fieldErrors?.unconfirmed && (
        <form action={resend} className="mt-4">
          <input type="hidden" name="email" value={state.values?.email ?? ""} />
          <button type="submit" className="type-caption font-semibold text-safelight-text underline underline-offset-4">
            Send the confirmation link again
          </button>
          {resendState.message && <p className="mt-2 type-caption font-normal text-ink-muted" role="status">{resendState.message}</p>}
        </form>
      )}

      <motion.p variants={item} className="mt-8 type-caption font-normal text-ink-muted">
        New to Framesly?{" "}
        <Link href="/signup" className="font-semibold text-safelight-text underline-offset-4 hover:underline">
          Start free
        </Link>
      </motion.p>
    </motion.div>
  )
}
