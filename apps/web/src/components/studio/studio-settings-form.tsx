"use client"

import { useRouter } from "next/navigation"
import { useActionState, useState, useTransition } from "react"

import { Aperture, FormAlert, SubmitButton } from "@/components/auth/primitives"
import { ColorPicker, GalleryCoverPreview, LogoPicker, useSlugCheck } from "@/components/studio/brand-controls"
import { Field } from "@/components/ui/field"
import { setStudioLogoAction, updateStudioAction } from "@/features/studio/actions"
import { uploadLogo } from "@/features/studio/upload-logo"
import { idle } from "@/lib/action-state"
import { toSlug, validateStudioSlug } from "@/lib/reserved-slugs"

type StudioProps = { id: string; name: string; slug: string; brandColor: string; region: string; logoUrl: string | null; isOwner: boolean }

const regionLabel: Record<string, string> = { in: "India (Mumbai)", us: "United States", eu: "Europe (Frankfurt)" }

/** Studio profile: what clients see on every gallery. */
export function StudioSettingsForm({ studio }: { studio: StudioProps }) {
  const router = useRouter()
  const [state, action] = useActionState(updateStudioAction, idle)
  const [name, setName] = useState(studio.name)
  const [slug, setSlug] = useState(studio.slug)
  const [brandColor, setBrandColor] = useState(studio.brandColor)
  const [logoUrl, setLogoUrl] = useState(studio.logoUrl)
  const [logoBusy, startLogo] = useTransition()
  const [logoError, setLogoError] = useState<string | null>(null)

  const slugError = validateStudioSlug(slug)
  const { result, checking } = useSlugCheck(slug, !slugError && slug !== studio.slug)
  const slugChanged = slug !== studio.slug

  const onLogo = (file: File) =>
    startLogo(async () => {
      setLogoError(null)
      try {
        const path = await uploadLogo(studio.id, file)
        const r = await setStudioLogoAction(path)
        if (!r.ok) throw new Error(r.message)
        setLogoUrl(URL.createObjectURL(file))
        router.refresh()
      } catch (e) {
        setLogoError(e instanceof Error ? e.message : "Upload failed. Try again.")
      }
    })

  const removeLogo = () =>
    startLogo(async () => {
      const r = await setStudioLogoAction(null)
      if (r.ok) {
        setLogoUrl(null)
        router.refresh()
      } else setLogoError(r.message ?? "Couldn't remove the logo.")
    })

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-10">
        <form action={action} className="space-y-6" noValidate>
          {!studio.isOwner && <FormAlert tone="info">Only the studio owner can change these settings.</FormAlert>}
          {state.status === "success" && <FormAlert tone="success">{state.message}</FormAlert>}
          {state.status === "error" && state.message && <FormAlert>{state.message}</FormAlert>}
          <Field label="Studio name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" error={state.fieldErrors?.name} disabled={!studio.isOwner} />
          <Field
            label="Gallery address"
            name="slug"
            prefix="framesly.app/"
            value={slug}
            spellCheck={false}
            autoCapitalize="none"
            onChange={(e) => setSlug(toSlug(e.target.value) || e.target.value.toLowerCase())}
            disabled={!studio.isOwner}
            error={state.fieldErrors?.slug ?? (slugChanged ? (slugError ?? (result && !result.available ? result.message : null)) : null)}
            hint={
              slugChanged ? (
                <span className="flex items-center gap-2" aria-live="polite">
                  {checking ? (<><Aperture className="size-3.5" /> Checking…</>) : result?.available ? <span className="text-success">Available. Links using the old address will stop working.</span> : "Letters, numbers and hyphens."}
                </span>
              ) : (
                "Shared gallery links use this address."
              )
            }
          />
          <div>
            <p className="type-caption text-ink">Brand colour</p>
            <div className="mt-3">
              <ColorPicker value={brandColor} onChange={setBrandColor} name="brandColor" />
            </div>
          </div>
          <div>
            <p className="type-caption text-ink">Data region</p>
            <p className="mt-1 text-ink-muted">{regionLabel[studio.region] ?? studio.region}. Set when the studio was created.</p>
          </div>
          {studio.isOwner && (
            <SubmitButton pendingLabel="Saving…" arrow={false} className="sm:w-auto">
              Save studio
            </SubmitButton>
          )}
        </form>

        <div>
          <p className="type-caption text-ink">Logo</p>
          <p className="mt-1 type-caption font-normal text-ink-muted">Shown top-left on every client gallery. Saves as soon as you choose it.</p>
          <div className="mt-3">
            <LogoPicker previewUrl={logoUrl} onFile={onLogo} onRemove={removeLogo} busy={logoBusy || !studio.isOwner} />
          </div>
          {logoBusy && <p className="mt-2 flex items-center gap-2 type-caption font-normal text-ink-muted"><Aperture className="size-3.5" /> Saving logo…</p>}
          {logoError && <p className="mt-2 type-caption text-danger" role="alert">{logoError}</p>}
        </div>
      </div>

      <aside aria-label="Client gallery preview" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 type-caption font-normal text-ink-muted">What your couples see</p>
        <GalleryCoverPreview studioName={name} slug={slug} brandColor={brandColor} logoUrl={logoUrl} />
      </aside>
    </div>
  )
}
