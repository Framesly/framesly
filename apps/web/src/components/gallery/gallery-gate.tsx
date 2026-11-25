"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { StudioLogo } from "@/components/studio/studio-logo"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { ACCENT_SURFACES, brandAccentStyle } from "@/lib/color"

type Studio = { name: string; logoUrl: string | null; brandColor?: string | null }

function Shell({ studio, children }: { studio: Studio; children: React.ReactNode }) {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-surface px-4 py-16"
      // The studio's colour for the button and focus ring, nudged to stay readable.
      style={brandAccentStyle(studio.brandColor, ACCENT_SURFACES.darkroomOverlay)}
    >
      <div className="w-full max-w-sm text-center">
        <StudioLogo
          name={studio.name}
          logoUrl={studio.logoUrl}
          imageClassName="mx-auto max-h-14 max-w-[200px]"
          textClassName="text-body tracking-[0.3em] text-ink"
        />
        <div className="mt-10">{children}</div>
        <p className="mt-16 type-label text-ink-muted">Delivered with Framesly</p>
      </div>
    </main>
  )
}

/** Shown when the gallery has a password and this browser hasn't unlocked it. */
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
      const data = res && (await res.json().catch(() => null))
      setError(data?.error ?? "Couldn't check the password. Try again.")
    })
  }

  return (
    <Shell studio={studio}>
      <h1 className="type-heading-1 text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">This gallery is private. Enter the password your photographer gave you.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 text-left" noValidate>
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
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
