"use client"

import { AnimatePresence, motion } from "motion/react"
import { useSearchParams } from "next/navigation"
import { useActionState, useState } from "react"

import { AuthBanner } from "@/components/auth/auth-showcase"
import { DrawnCheck, FormAlert, GoogleButton, item, OrDivider, PasswordField, PasswordRules, stagger, SubmitButton } from "@/components/auth/primitives"
import { TransitionLink as Link } from "@/components/transition/page-transition"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { resendConfirmationAction, signUpAction } from "@/features/auth/actions"
import { idle } from "@/lib/action-state"
import { isGoogleAuthEnabled } from "@/lib/supabase/env"

const planNames: Record<string, string> = { solo: "Solo", studio: "Studio", collective: "Collective" }

export function SignupForm() {
  const params = useSearchParams()
  const plan = params.get("plan") ?? ""
  const [state, action] = useActionState(signUpAction, idle)
  const [password, setPassword] = useState("")

  return (
    <div className="w-full max-w-[420px]">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <CheckInbox key="inbox" email={state.message ?? ""} />
        ) : (
          <motion.div key="form" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -12 }}>
            <motion.div variants={item} className="mb-8 lg:hidden">
              <AuthBanner />
            </motion.div>
            <motion.h1 variants={item} className="type-heading-1 text-balance md:type-display-l">
              Open your studio
            </motion.h1>
            <motion.p variants={item} className="mt-3 text-ink-muted">
              {planNames[plan] ? `You're starting the ${planNames[plan]} plan trial. ` : ""}14 days free, no card needed.
            </motion.p>

            {isGoogleAuthEnabled && (
              <>
                <motion.div variants={item} className="mt-8">
                  <GoogleButton next="/onboarding" plan={plan || undefined} />
                </motion.div>
                <motion.div variants={item}>
                  <OrDivider />
                </motion.div>
              </>
            )}

            <form action={action} className={isGoogleAuthEnabled ? "space-y-5" : "mt-8 space-y-5"} noValidate>
              <input type="hidden" name="plan" value={plan} />
              {state.message && state.status === "error" && (
                <FormAlert>{state.message}</FormAlert>
              )}
              <motion.div variants={item}>
                <Field label="Your name" name="fullName" autoComplete="name" placeholder="Priya Sharma…" required defaultValue={state.values?.fullName} error={state.fieldErrors?.fullName} />
              </motion.div>
              <motion.div variants={item}>
                <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="you@studio.com…" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
              </motion.div>
              <motion.div variants={item}>
                <PasswordField
                  label="Password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={state.fieldErrors?.password}
                />
                <PasswordRules value={password} />
              </motion.div>
              <motion.div variants={item}>
                <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
              </motion.div>
            </form>

            <motion.p variants={item} className="mt-8 type-caption font-normal text-ink-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-safelight-text underline-offset-4 hover:underline">
                Log in
              </Link>
            </motion.p>
            <motion.p variants={item} className="mt-3 type-caption font-normal text-ink-muted">
              By creating an account you agree to the{" "}
              <Link href="/legal/terms" className="underline underline-offset-4">terms</Link> and{" "}
              <Link href="/legal/privacy" className="underline underline-offset-4">privacy policy</Link>.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckInbox({ email }: { email: string }) {
  const [state, resend] = useActionState(resendConfirmationAction, idle)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <DrawnCheck />
      <h1 className="mt-6 type-heading-1 md:type-display-l">Check your inbox</h1>
      <p className="mt-3 type-body-l text-ink-muted">
        We sent a confirmation link to <span className="text-ink">{email}</span>. Open it to set up your studio.
      </p>
      <form action={resend} className="mt-8 flex flex-wrap items-center gap-3">
        <input type="hidden" name="email" value={email} />
        <Button type="submit" variant="secondary">Send the link again</Button>
        <Link href="/login" className="type-caption font-semibold text-safelight-text underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </form>
      {state.message && (
        <div className="mt-4">
          <FormAlert tone={state.status === "error" ? "error" : "success"}>{state.message}</FormAlert>
        </div>
      )}
    </motion.div>
  )
}
