"use client"

import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Aperture, DrawnCheck, FormAlert } from "@/components/auth/primitives"
import { ColorPicker, GalleryCoverPreview, LogoPicker, useSlugCheck } from "@/components/studio/brand-controls"
import { Button, ButtonArrow } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { createStudioAction, setStudioLogoAction } from "@/features/studio/actions"
import { uploadLogo } from "@/features/studio/upload-logo"
import { toSlug, validateStudioSlug } from "@/lib/reserved-slugs"
import { cn } from "@/lib/utils"

const develop = [0.22, 1, 0.36, 1] as const

const steps = [
  { title: "Name your studio", short: "Studio" },
  { title: "Make it yours", short: "Brand" },
] as const

/**
 * The studio's region label, from the photographer's time zone, so setup
 * doesn't need to ask. It is informational: every studio's photos live in the
 * same storage, served worldwide through the media CDN.
 */
function detectRegion(): "in" | "eu" | "us" {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
  if (/^Asia\/(Kolkata|Calcutta)$/.test(zone)) return "in"
  if (zone.startsWith("Europe/")) return "eu"
  return "us"
}

/**
 * First-run setup: studio name and address, then brand. Enter submits a step.
 * The gallery cover preview on the right updates as they type, so they see
 * what their couples will see.
 */
export function OnboardingWizard({ firstName }: { firstName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [brandColor, setBrandColor] = useState("#F2A93B")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<"form" | "saving" | "done">("form")
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<Record<string, string>>({})

  const effectiveSlug = slugEdited ? slug : toSlug(name)
  const localSlugError = effectiveSlug.length >= 3 ? validateStudioSlug(effectiveSlug) : null
  const { result: slugResult, checking } = useSlugCheck(effectiveSlug, !localSlugError)

  const logoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile])
  useEffect(() => () => (logoUrl ? URL.revokeObjectURL(logoUrl) : undefined), [logoUrl])

  const canContinue =
    step === 0
      ? name.trim().length >= 2 && !localSlugError && effectiveSlug.length >= 3 && slugResult?.available === true && !checking
      : true

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
    setError(null)
  }

  const finish = async () => {
    setPhase("saving")
    setError(null)
    const res = await createStudioAction({ name, slug: effectiveSlug, brandColor, region: detectRegion() })
    if (!res.ok) {
      setPhase("form")
      if (res.fieldErrors) {
        setFieldError(res.fieldErrors)
        if (res.fieldErrors.slug || res.fieldErrors.name) go(0)
      }
      if (res.message) {
        setError(res.message)
        if (/already have a studio/i.test(res.message)) router.replace("/app")
      }
      return
    }
    if (logoFile) {
      try {
        const path = await uploadLogo(res.studioId, logoFile)
        await setStudioLogoAction(path)
      } catch {
        // The studio exists; a failed logo upload shouldn't block them. They can add it in settings.
      }
    }
    setPhase("done")
    setTimeout(() => router.replace("/app?welcome=1"), 1100)
  }

  if (phase === "done") {
    return (
      <motion.div className="mx-auto flex max-w-md flex-col items-center py-24 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <DrawnCheck />
        <h1 className="mt-6 type-heading-1">{name} is ready</h1>
        <p className="mt-2 text-ink-muted">Opening your dashboard…</p>
      </motion.div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
      <div className="min-w-0">
        <p className="text-ink-muted">{firstName ? `Welcome, ${firstName}.` : "Welcome."} Two quick steps, then you’re in.</p>

        {/* Progress: a real sequence, so it's numbered */}
        <ol className="mt-6 grid grid-cols-2 gap-2" aria-label="Setup progress">
          {steps.map((s, i) => (
            <li key={s.short}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i < step && go(i)}
                aria-current={i === step ? "step" : undefined}
                className="group w-full text-left disabled:cursor-default"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-line">
                  <motion.span className="block h-full origin-left bg-safelight" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.5, ease: develop }} />
                </span>
                <span className={cn("mt-2 block type-caption", i === step ? "text-ink" : "text-ink-muted", i < step && "group-hover:text-ink")}>
                  {i + 1}. {s.short}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (phase === "saving") return
            if (step < steps.length - 1) {
              if (canContinue) go(step + 1)
            } else void finish()
          }}
        >
          <div className="relative mt-10 min-h-[320px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section
              key={step}
              custom={dir}
              aria-labelledby={`step-${step}-title`}
              initial={{ opacity: 0, x: dir * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.4, ease: develop }}
            >
              <h1 id={`step-${step}-title`} className="type-heading-1 md:type-display-l">{steps[step].title}</h1>

              {step === 0 && (
                <div className="mt-8 space-y-6">
                  <Field
                    label="Studio name"
                    placeholder="Saffron Lane Studio…"
                    autoComplete="organization"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={fieldError.name}
                    hint="This is what clients see on every gallery."
                    autoFocus
                  />
                  <Field
                    label="Gallery address"
                    prefix="framesly.app/"
                    value={effectiveSlug}
                    spellCheck={false}
                    autoCapitalize="none"
                    onChange={(e) => {
                      setSlugEdited(true)
                      setSlug(toSlug(e.target.value) || e.target.value.toLowerCase())
                    }}
                    error={fieldError.slug ?? localSlugError ?? (slugResult && !slugResult.available ? slugResult.message : null)}
                    hint={
                      <span className="flex items-center gap-2" aria-live="polite">
                        {checking ? (
                          <>
                            <Aperture className="size-3.5" /> Checking…
                          </>
                        ) : slugResult?.available ? (
                          <span className="text-success">Available. Your galleries will live here.</span>
                        ) : (
                          "Letters, numbers and hyphens. You can change it later."
                        )}
                      </span>
                    }
                  />
                </div>
              )}

              {step === 1 && (
                <div className="mt-8 space-y-8">
                  <div>
                    <p className="type-caption text-ink">Brand colour</p>
                    <p className="mt-1 type-caption font-normal text-ink-muted">Used for buttons and highlights in your client galleries.</p>
                    <div className="mt-4">
                      <ColorPicker value={brandColor} onChange={setBrandColor} />
                    </div>
                  </div>
                  <div>
                    <p className="type-caption text-ink">Logo <span className="font-normal text-ink-muted">(optional)</span></p>
                    <div className="mt-3">
                      <LogoPicker previewUrl={logoUrl} onFile={setLogoFile} onRemove={() => setLogoFile(null)} />
                    </div>
                  </div>
                </div>
              )}

            </motion.section>
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-6">
            <FormAlert>{error}</FormAlert>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="quiet" onClick={() => go(step - 1)} disabled={phase === "saving"}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <Button type="submit" size="lg" disabled={!canContinue}>
              Continue
              <ButtonArrow />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={phase === "saving"} aria-busy={phase === "saving"}>
              {phase === "saving" ? (
                <>
                  <Aperture /> Creating your studio…
                </>
              ) : (
                <>
                  Create studio
                  <ButtonArrow />
                </>
              )}
            </Button>
          )}
        </div>
        </form>
      </div>

      {/* Live preview of what couples will see */}
      <aside aria-label="Client gallery preview" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 type-caption font-normal text-ink-muted">What your couples will see</p>
        <div className="hidden lg:block">
          <GalleryCoverPreview studioName={name} slug={effectiveSlug} brandColor={brandColor} logoUrl={logoUrl} />
        </div>
        <div className="lg:hidden">
          <GalleryCoverPreview studioName={name} slug={effectiveSlug} brandColor={brandColor} logoUrl={logoUrl} compact />
        </div>
      </aside>
    </div>
  )
}
