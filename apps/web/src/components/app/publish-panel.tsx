"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { Aperture } from "@/components/auth/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/field"
import { useToast } from "@/components/ui/toast"
import { toSlug } from "@/lib/reserved-slugs"
import { cn } from "@/lib/utils"

type PublishState = { publicSlug: string | null; publishedAt: string | null; expiresAt: string | null; hasPassword: boolean }

const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" })

/** yyyy-mm-dd in the photographer's local time (for <input type="date">). */
function toDateInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** The end of the chosen day, local time, as an ISO timestamp. */
function endOfDay(date: string) {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null
}

/**
 * Turns a draft gallery into a private client link: link name, optional
 * password, optional expiry, copy and unpublish.
 */
export function PublishPanel({ galleryId, title, origin, initial }: { galleryId: string; title: string; origin: string; initial: PublishState }) {
  const router = useRouter()
  const [state, setState] = useState(initial)
  const [slug, setSlug] = useState(initial.publicSlug ?? toSlug(title))
  const [password, setPassword] = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [expiry, setExpiry] = useState(toDateInput(initial.expiresAt))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [availability, setAvailability] = useState<{ slug: string; ok: boolean; text: string } | null>(null)
  const toast = useToast()
  const [pending, start] = useTransition()

  const published = Boolean(state.publishedAt)
  const link = `${origin}/g/${state.publicSlug ?? slug}`
  const host = origin.replace(/^https?:\/\//, "")
  const today = toDateInput(new Date().toISOString())

  // Live "is this link name free?" check, after typing pauses.
  useEffect(() => {
    if (slug.length < 3 || slug === state.publicSlug) return
    let current = true
    const t = setTimeout(async () => {
      const res = await fetch(`/api/galleries/${galleryId}/publish?slug=${encodeURIComponent(slug)}`).catch(() => null)
      const data = res && (await res.json().catch(() => null))
      if (current && data) setAvailability({ slug, ok: Boolean(data.available), text: data.message ?? data.error ?? "" })
    }, 450)
    return () => {
      current = false
      clearTimeout(t)
    }
  }, [slug, galleryId, state.publicSlug])

  const slugCheck = availability && availability.slug === slug && slug !== state.publicSlug ? availability : null

  const publish = () =>
    start(async () => {
      setErrors({})
      setMessage(null)
      const res = await fetch(`/api/galleries/${galleryId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password: password || undefined, removePassword, expiresAt: endOfDay(expiry) }),
      }).catch(() => null)
      const data = res && (await res.json().catch(() => null))
      if (!res || !res.ok || !data) {
        setErrors(data?.fieldErrors ?? {})
        setMessage({ tone: "error", text: data?.error ?? "Couldn't publish. Check your connection and try again." })
        return
      }
      setState({ publicSlug: data.slug, publishedAt: data.publishedAt, expiresAt: data.expiresAt, hasPassword: data.hasPassword })
      setPassword("")
      setRemovePassword(false)
      setMessage({ tone: "success", text: published ? "Link updated." : "Published. Copy the link and send it to your couple." })
      router.refresh()
    })

  const unpublish = () =>
    start(async () => {
      setMessage(null)
      const res = await fetch(`/api/galleries/${galleryId}/publish`, { method: "DELETE" }).catch(() => null)
      if (!res?.ok) {
        setMessage({ tone: "error", text: "Couldn't unpublish. Try again." })
        return
      }
      setState((s) => ({ ...s, publishedAt: null }))
      setMessage({ tone: "success", text: "Unpublished. The link no longer opens; publish again to reuse it." })
      router.refresh()
    })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: "Link copied", body: "Send it to your couple.", tone: "success" })
    } catch {
      setMessage({ tone: "error", text: "Couldn't copy. Select the link and copy it yourself." })
    }
  }

  return (
    <section aria-labelledby="publish-title" className="rounded-[var(--radius-cover)] border border-line bg-surface-raised p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="publish-title" className="type-heading-2">Client link</h2>
        <Badge tone={published ? "success" : "neutral"}>{published ? "Published" : "Draft"}</Badge>
      </div>
      <p className="mt-1 type-caption font-normal text-ink-muted">
        {published ? "Your couple can open this link." : "Only you can see this gallery until you publish it."}
      </p>

      {published && (
        <div className="mt-5 rounded-[var(--radius-control)] border border-line bg-surface-sunken p-3">
          <p className="break-all type-caption text-ink" aria-label="Client link">{link}</p>
          <p className="mt-1 type-caption font-normal text-ink-muted">
            {state.hasPassword ? "Password protected" : "No password"}
            {" · "}
            {state.expiresAt ? `Expires ${dateFmt.format(new Date(state.expiresAt))}` : "Never expires"}
          </p>
          <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={copy}>
            Copy link
          </Button>
        </div>
      )}

      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          publish()
        }}
      >
        <Field
          label="Link name"
          name="slug"
          prefix={`${host}/g/`}
          value={slug}
          spellCheck={false}
          autoCapitalize="none"
          maxLength={60}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-"))}
          error={errors.slug ?? (slugCheck && !slugCheck.ok ? slugCheck.text : null)}
          hint={slugCheck?.ok ? <span className="text-success">Available.</span> : "Letters, numbers and hyphens. Changing it breaks the old link."}
        />
        <Field
          label={state.hasPassword ? "New password (optional)" : "Password (optional)"}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          maxLength={72}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={state.hasPassword ? "Leave empty to keep the current password." : "Leave empty for anyone with the link to view."}
        />
        {state.hasPassword && !password && (
          <Checkbox label="Remove the password" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} />
        )}
        <Field
          label="Expiry date (optional)"
          name="expiresAt"
          type="date"
          min={today}
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          error={errors.expiresAt}
          hint="The link stops working after this day. Leave empty to keep it open."
        />

        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={cn("type-caption", message.tone === "error" ? "text-danger" : "text-success")}>
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || slug.length < 3}>
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
    </section>
  )
}
