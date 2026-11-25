"use client"

import { useEffect, useState, useTransition } from "react"

import { Aperture } from "@/components/auth/primitives"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog } from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import { toSlug } from "@/lib/reserved-slugs"
import { cn } from "@/lib/utils"

export type ShareState = {
  publicSlug: string | null
  publishedAt: string | null
  expiresAt: string | null
  hasPassword: boolean
  /** The key in plain text; null when there is none or it predates readable keys. */
  key: string | null
}

type PublishResponse = { slug: string; publishedAt: string; expiresAt: string | null; hasPassword: boolean; key: string | null; error?: string; fieldErrors?: Record<string, string> }

const expiryFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" })

/** "YYYY-MM-DD" of an ISO timestamp, in the photographer's local time. */
function toDay(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
/** The end of that local day, as an ISO timestamp. */
const endOfDay = (day: string | null) => (day ? new Date(`${day}T23:59:59`).toISOString() : null)

async function publishRequest(galleryId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/galleries/${galleryId}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
  const data: PublishResponse | null = res ? await res.json().catch(() => null) : null
  return { ok: Boolean(res?.ok && data), data }
}

function useCopy() {
  const toast = useToast()
  return async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: `${what} copied`, tone: "success" })
    } catch {
      toast({ title: `Couldn't copy the ${what.toLowerCase()}`, body: "Select it and copy it yourself." })
    }
  }
}

/**
 * Sharing at the top of a gallery: the client link and its key, always in
 * view, with copy, a one-click key reset and the sharing settings in a dialog.
 */
export function ShareBar({ galleryId, title, origin, initial }: { galleryId: string; title: string; origin: string; initial: ShareState }) {
  const [state, setState] = useState(initial)
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, startReset] = useTransition()
  const copy = useCopy()
  const toast = useToast()

  const published = Boolean(state.publishedAt)
  const link = state.publicSlug ? `${origin}/g/${state.publicSlug}` : ""
  const expired = Boolean(state.expiresAt && new Date(state.expiresAt) <= new Date())

  // A second click within a few seconds confirms the reset; otherwise it disarms.
  useEffect(() => {
    if (!confirmReset) return
    const t = setTimeout(() => setConfirmReset(false), 4000)
    return () => clearTimeout(t)
  }, [confirmReset])

  const resetKey = () => {
    if (!confirmReset) return setConfirmReset(true)
    setConfirmReset(false)
    startReset(async () => {
      const { ok, data } = await publishRequest(galleryId, { slug: state.publicSlug, resetKey: true, expiresAt: expired ? null : state.expiresAt })
      if (!ok || !data) return toast({ title: data?.error ?? "Couldn't reset the key", body: "Check your connection and try again." })
      setState({ publicSlug: data.slug, publishedAt: data.publishedAt, expiresAt: data.expiresAt, hasPassword: data.hasPassword, key: data.key })
      toast({ title: state.hasPassword ? "New key ready" : "Key added", body: "Send the new key to your couple.", tone: "success" })
    })
  }

  return (
    <section aria-label="Client link" className="rounded-[var(--radius-control)] border border-line bg-surface-raised">
      {published ? (
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-control)] bg-line lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3 bg-surface-raised px-4 py-3">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", expired ? "bg-danger" : "bg-success")} />
            <div className="min-w-0 flex-1">
              <p className="type-caption font-normal text-ink-muted">{expired ? "Link expired" : state.expiresAt ? `Live until ${expiryFmt.format(new Date(state.expiresAt))}` : "Live link"}</p>
              <a href={link} target="_blank" rel="noopener" className="block truncate type-caption text-ink hover:text-safelight-text" translate="no">
                {link.replace(/^https?:\/\//, "")}
              </a>
            </div>
            <Button size="sm" variant="secondary" onClick={() => copy(link, "Link")}>
              <Icon name="copy" className="size-4" />
              Copy
            </Button>
          </div>

          <div className="flex min-w-0 items-center gap-3 bg-surface-raised px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="type-caption font-normal text-ink-muted">Gallery key</p>
              {state.key ? (
                <p className="truncate font-mono text-[15px] leading-6 tracking-wide text-ink" translate="no">{state.key}</p>
              ) : (
                <p className="truncate type-caption text-ink-muted">{state.hasPassword ? "Set before keys were visible" : "None: anyone with the link"}</p>
              )}
            </div>
            {state.key && (
              <button type="button" aria-label="Copy key" title="Copy key" onClick={() => copy(state.key!, "Key")} className="grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink">
                <Icon name="copy" className="size-4" />
              </button>
            )}
            <Button size="sm" variant={confirmReset ? "danger" : "quiet"} onClick={resetKey} disabled={resetting || expired}>
              {resetting ? <Aperture className="size-4" /> : <Icon name="retry" className="size-4" />}
              {confirmReset ? "Confirm" : state.hasPassword ? "Reset" : "Add key"}
            </Button>
          </div>

          <div className="flex items-center bg-surface-raised px-4 py-3">
            <Button size="sm" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
              <Icon name="settings" className="size-4" />
              Settings
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-ink-muted" />
          <p className="min-w-0 flex-1 type-caption text-ink-muted">
            <span className="text-ink">Not shared yet.</span> Publish to get a private link and a key for your couple.
          </p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Icon name="share" className="size-4" />
            Share gallery
          </Button>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={published ? "Sharing settings" : "Share this gallery"}>
        <ShareForm
          galleryId={galleryId}
          title={title}
          origin={origin}
          state={state}
          onSaved={(next) => {
            setState(next)
            setOpen(false)
          }}
        />
      </Dialog>
    </section>
  )
}

/** Link name, key and expiry; publish, save or unpublish. */
function ShareForm({ galleryId, title, origin, state, onSaved }: { galleryId: string; title: string; origin: string; state: ShareState; onSaved: (s: ShareState) => void }) {
  const toast = useToast()
  const published = Boolean(state.publishedAt)
  const [slug, setSlug] = useState(state.publicSlug ?? toSlug(title))
  const [key, setKey] = useState("")
  const [useKey, setUseKey] = useState(published ? state.hasPassword : true)
  const [expiry, setExpiry] = useState<string | null>(toDay(state.expiresAt))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<{ slug: string; ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const host = origin.replace(/^https?:\/\//, "")
  const today = toDay(new Date().toISOString())!

  // Live "is this link name free?" check, after typing pauses.
  useEffect(() => {
    if (slug.length < 3 || slug === state.publicSlug) return
    let current = true
    const t = setTimeout(async () => {
      const res = await fetch(`/api/galleries/${galleryId}/publish?slug=${encodeURIComponent(slug)}`).catch(() => null)
      const data = res && (await res.json().catch(() => null))
      if (current && data) setAvailability({ slug, ok: Boolean(data.available), text: data.message ?? data.error ?? "" })
    }, 400)
    return () => {
      current = false
      clearTimeout(t)
    }
  }, [slug, galleryId, state.publicSlug])
  const slugCheck = availability && availability.slug === slug && slug !== state.publicSlug ? availability : null

  const save = () =>
    start(async () => {
      setErrors({})
      setFormError(null)
      // A first key with nothing typed gets a generated one.
      const resetKey = useKey && !key && !state.hasPassword
      const { ok, data } = await publishRequest(galleryId, {
        slug,
        password: useKey && key ? key : undefined,
        removePassword: !useKey,
        resetKey,
        expiresAt: endOfDay(expiry),
      })
      if (!ok || !data) {
        setErrors(data?.fieldErrors ?? {})
        setFormError(data?.error ?? "Couldn't save. Check your connection and try again.")
        return
      }
      onSaved({ publicSlug: data.slug, publishedAt: data.publishedAt, expiresAt: data.expiresAt, hasPassword: data.hasPassword, key: data.key ?? (data.hasPassword ? state.key : null) })
      toast({ title: published ? "Sharing updated" : "Gallery published", body: published ? undefined : "Copy the link and key from the top of the page.", tone: "success" })
    })

  const unpublish = () =>
    start(async () => {
      const res = await fetch(`/api/galleries/${galleryId}/publish`, { method: "DELETE" }).catch(() => null)
      if (!res?.ok) return setFormError("Couldn't unpublish. Try again.")
      onSaved({ ...state, publishedAt: null })
      toast({ title: "Unpublished", body: "The link no longer opens. Publish again to reuse it." })
    })

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <Field
        label="Link name"
        name="slug"
        prefix={`${host}/g/`}
        value={slug}
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        maxLength={60}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-"))}
        error={errors.slug ?? (slugCheck && !slugCheck.ok ? slugCheck.text : null)}
        hint={slugCheck?.ok ? <span className="text-success">Available.</span> : published ? "Changing it breaks the old link." : "Letters, numbers and hyphens."}
      />

      <div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 type-caption text-ink">
          <input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} className="size-5 accent-[var(--safelight)]" />
          Ask for a key to open the gallery
        </label>
        {useKey && (
          <Field
            label={state.hasPassword ? "New key (optional)" : "Key (optional)"}
            name="key"
            value={key}
            maxLength={72}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setKey(e.target.value)}
            error={errors.password}
            placeholder={state.key ?? "We'll make one, like mrkt-4827…"}
            hint={state.hasPassword ? "Leave empty to keep the current key." : "Leave empty and we'll make one for you."}
            className="mt-2"
          />
        )}
      </div>

      <div>
        <p className="mb-2 type-caption text-ink">Expiry date (optional)</p>
        <DatePicker label="Expiry date" value={expiry} onChange={setExpiry} min={today} placeholder="Never expires" />
        <p className={cn("mt-1.5 type-caption font-normal", errors.expiresAt ? "text-danger" : "text-ink-muted")}>{errors.expiresAt ?? "The link stops working after this day."}</p>
      </div>

      {formError && (
        <p role="alert" className="type-caption text-danger">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" disabled={pending || slug.length < 3 || Boolean(slugCheck && !slugCheck.ok)}>
          {pending ? <Aperture className="size-4" /> : null}
          {published ? "Save changes" : "Publish gallery"}
        </Button>
        {published && (
          <Button type="button" variant="quiet" disabled={pending} onClick={unpublish}>
            Unpublish
          </Button>
        )}
      </div>
    </form>
  )
}
