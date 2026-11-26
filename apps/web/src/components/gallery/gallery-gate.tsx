"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { StudioLogo } from "@/components/studio/studio-logo"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { ACCENT_SURFACES, brandAccentStyle } from "@/lib/color"

type Studio = { name: string; logoUrl: string | null; brandColor?: string | null }

/** The frame of every gate screen: the photographer's logo (when known), the message, a quiet Framesly credit. */
function Shell({ studio, children }: { studio?: Studio; children: React.ReactNode }) {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-surface px-4 py-16"
      // The studio's colour for the button and focus ring, nudged to stay readable.
      style={studio ? brandAccentStyle(studio.brandColor, ACCENT_SURFACES.darkroomOverlay) : undefined}
    >
      <div className="w-full max-w-sm text-center">
        {studio && (
          <StudioLogo
            name={studio.name}
            logoUrl={studio.logoUrl}
            imageClassName="mx-auto max-h-14 max-w-[200px]"
            textClassName="text-body tracking-[0.3em] text-ink"
          />
        )}
        <div className={studio ? "mt-10" : ""}>{children}</div>
        <p className="mt-16 type-label text-ink-muted">Delivered with Framesly</p>
      </div>
    </main>
  )
}

/** Shown when the gallery has a key and this browser hasn't unlocked it. */
export function PasswordScreen({ slug, title, studio }: { slug: string; title: string; studio: Studio }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      setError(null)
      const res = await fetch(`/api/g/${slug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }).catch(() => null)
      if (res?.ok) {
        router.refresh()
        return
      }
      // Unpublished or expired meanwhile: show that screen instead of an error under the field.
      if (res && (res.status === 404 || res.status === 410)) {
        router.refresh()
        return
      }
      const data = res && (await res.json().catch(() => null))
      setError(data?.error ?? "Couldn't check the key. Try again.")
    })
  }

  return (
    <Shell studio={studio}>
      <h1 className="type-heading-1 text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">This gallery is private. Enter the gallery key {studio.name} sent you.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 text-left" noValidate>
        <Field
          label="Gallery key"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending || !password}>
          {pending ? "Checking…" : "View the photos"}
        </Button>
      </form>
    </Shell>
  )
}

/** Shown while the photographer has the gallery unpublished. Publishing again brings the same link back. */
export function UnpublishedScreen({ studio }: { studio: Studio }) {
  return (
    <Shell studio={studio}>
      <h1 className="type-heading-1 text-balance text-ink">This gallery isn&apos;t available right now</h1>
      <p className="mt-2 text-pretty text-ink-muted">
        {studio.name} has taken it offline for the moment. When they share it again, this same link will work. Ask them if you need it sooner.
      </p>
    </Shell>
  )
}

/** Shown for a link that doesn't match any gallery (mistyped, or the gallery was renamed or deleted). */
export function MissingScreen() {
  return (
    <Shell>
      <h1 className="type-heading-1 text-balance text-ink">We couldn&apos;t find this gallery</h1>
      <p className="mt-2 text-pretty text-ink-muted">
        Check the link your photographer sent you. If it still doesn&apos;t open, the gallery may have been renamed: ask them for the new link.
      </p>
    </Shell>
  )
}

/** Shown after the gallery's expiry date. */
export function ExpiredScreen({ studio }: { studio: Studio }) {
  return (
    <Shell studio={studio}>
      <h1 className="type-heading-1 text-ink">This gallery has expired</h1>
      <p className="mt-2 text-ink-muted">
        The link was open for a limited time. Ask {studio.name} if you&apos;d like it opened again.
      </p>
    </Shell>
  )
}
