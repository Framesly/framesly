"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Studio = { name: string; logoUrl: string | null }

function StudioMark({ studio }: { studio: Studio }) {
  return studio.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- photographer's logo from Storage, any format incl. SVG
    <img src={studio.logoUrl} alt={studio.name} className="mx-auto max-h-14 max-w-[200px] object-contain" />
  ) : (
    <p className="font-heading text-[15px] font-bold tracking-[0.3em] text-ink uppercase">{studio.name}</p>
  )
}

function Shell({ studio, children }: { studio: Studio; children: React.ReactNode }) {
  return (
    <main className="theme-print grid min-h-dvh place-items-center bg-surface px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <StudioMark studio={studio} />
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
      <form onSubmit={submit} className="mt-8 space-y-3 text-left" noValidate>
        <label htmlFor="gallery-password" className="type-caption text-ink">Password</label>
        <input
          id="gallery-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "gallery-password-error" : undefined}
          className="block h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface-raised px-4 text-ink outline-none focus:border-ink"
        />
        {error && (
          <p id="gallery-password-error" role="alert" className="type-caption text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending || !password}
          className="h-12 w-full rounded-[var(--radius-control)] bg-ink type-caption text-surface transition-opacity disabled:opacity-50"
        >
          {pending ? "Checking…" : "View the photos"}
        </button>
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
