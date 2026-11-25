"use client"

import { AnimatePresence, motion, type Variants } from "motion/react"
import { useState, type ComponentProps, type ReactNode } from "react"
import { useFormStatus } from "react-dom"

import { googleSignInAction } from "@/features/auth/actions"
import { ButtonArrow, buttonVariants } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

export const develop = [0.22, 1, 0.36, 1] as const

/** Auth forms rise in block by block on first paint (one orchestrated moment). */
export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }
export const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: develop } },
}

/** Aperture spinner shown while a form submits. */
export function Aperture({ className = "size-5" }: { className?: string }) {
  return (
    <motion.svg viewBox="0 0 24 24" className={className} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M12 3.5 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
      ))}
    </motion.svg>
  )
}

/** A check mark that draws itself inside a ring. */
export function DrawnCheck() {
  return (
    <svg viewBox="0 0 64 64" className="size-16 text-success" aria-hidden>
      <motion.circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: develop }} />
      <motion.path d="M20 33.5 28.5 42 45 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: develop, delay: 0.55 }} />
    </svg>
  )
}

/**
 * Submit button that shows the aperture and a "…" label while its form is
 * pending (rendering-usetransition-loading via useFormStatus).
 */
export function SubmitButton({ children, pendingLabel, className, arrow = true }: { children: ReactNode; pendingLabel: string; className?: string; arrow?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(buttonVariants({ size: "lg" }), "w-full", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span key="p" className="flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Aperture />
            {pendingLabel}
          </motion.span>
        ) : (
          <motion.span key="i" className="flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {children}
            {arrow && <ButtonArrow />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

/** Form-level message. Errors explain what to do next. */
export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[var(--radius-control)] border px-4 py-3 type-caption font-normal",
        tone === "error" && "border-danger/50 bg-danger/10 text-ink",
        tone === "success" && "border-success/50 bg-success/10 text-ink",
        tone === "info" && "border-line bg-surface-sunken text-ink"
      )}
    >
      {children}
    </motion.div>
  )
}

export function OrDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="type-caption font-normal text-ink-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function GooglePending() {
  const { pending } = useFormStatus()
  return pending ? <Aperture className="size-[18px]" /> : <GoogleMark />
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.34Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  )
}

/** "Continue with Google" as its own small form, so it works without JS too. */
export function GoogleButton({ next, plan }: { next?: string; plan?: string }) {
  return (
    <form action={googleSignInAction}>
      {next && <input type="hidden" name="next" value={next} />}
      {plan && <input type="hidden" name="plan" value={plan} />}
      <button type="submit" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}>
        <GooglePending />
        Continue with Google
      </button>
    </form>
  )
}

/** Password input with a show/hide toggle. */
export function PasswordField(props: Omit<ComponentProps<typeof Field>, "type" | "suffix">) {
  const [show, setShow] = useState(false)
  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      suffix={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="mr-1 grid h-full w-11 shrink-0 place-items-center rounded-[var(--radius-chip)] text-ink-muted transition-colors hover:text-ink"
        >
          <Icon name={show ? "eye-off" : "eye"} className="size-[18px]" />
        </button>
      }
    />
  )
}

/** Live checklist under a new password, matching the server rules. */
export function PasswordRules({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "8 or more characters" },
    { ok: /[a-zA-Z]/.test(value), label: "A letter" },
    { ok: /[0-9]/.test(value), label: "A number" },
  ]
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
      {rules.map((r) => (
        <li key={r.label} className={cn("flex items-center gap-1.5 type-caption font-normal transition-colors", r.ok ? "text-success" : "text-ink-muted")}>
          <span aria-hidden className={cn("grid size-3.5 place-items-center rounded-full border transition-colors", r.ok ? "border-success bg-success" : "border-line-strong")}>
            {r.ok && (
              <svg viewBox="0 0 12 12" className="size-2.5 text-surface">
                <path d="M2.5 6.2 5 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {r.label}
          <span className="sr-only">{r.ok ? "(done)" : "(not yet)"}</span>
        </li>
      ))}
    </ul>
  )
}
