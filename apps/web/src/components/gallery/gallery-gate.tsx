"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { PasswordField } from "@/components/auth/primitives"
import { BrandMark } from "@/components/site/wordmark"
import { StudioLogo } from "@/components/studio/studio-logo"
import { Button } from "@/components/ui/button"
import { Viewfinder } from "@/components/ui/viewfinder"
import { ACCENT_SURFACES, brandAccentStyle } from "@/lib/color"

type Studio = { name: string; logoUrl: string | null; brandColor?: string | null }

/**
 * The couple's names (or the studio's) set very large in outline, drifting
 * slowly behind the card. Pure type, no photos: nothing of the gallery shows
 * before it is unlocked. The middle fades out so the card stays calm, and the
 * drift stops for reduced motion (global rule in globals.css).
 */
function NameBackdrop({ text }: { text: string }) {
  const rows = [
    { dir: "animate-[marquee-left_140s_linear_infinite]", offset: "" },
    { dir: "animate-[marquee-right_160s_linear_infinite]", offset: "-translate-x-1/4" },
    { dir: "animate-[marquee-left_180s_linear_infinite]", offset: "" },
  ]
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-[2vh] overflow-hidden select-none [mask-image:radial-gradient(ellipse_55%_45%_at_50%_50%,transparent_35%,black_100%)]"
    >
      {rows.map((row, i) => (
        <div key={i} className={row.offset}>
          <div className={`flex w-max ${row.dir}`}>
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="pr-[0.6em] font-heading text-[clamp(72px,15vw,200px)] leading-none font-bold tracking-[-0.03em] whitespace-nowrap text-transparent [-webkit-text-stroke:1px_var(--line-strong)]"
              >
                {Array.from({ length: 3 }, () => text).join("  ·  ")}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * The frame of every gate screen: the photographer's brand on a calm card,
 * the couple's names drifting behind it, and the Framesly credit at the foot.
 */
function Shell({ studio, backdrop, children }: { studio?: Studio; backdrop: string; children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-surface px-4 pt-16 pb-24">
      <NameBackdrop text={backdrop} />

      <div
        className="relative w-full max-w-sm"
        // The studio's colour for the glow, brackets, button and focus ring, nudged to stay readable.
        // Applied here, not on <main>, so the Framesly mark below keeps its own colour.
        style={studio ? brandAccentStyle(studio.brandColor, ACCENT_SURFACES.darkroomOverlay) : undefined}
      >
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--safelight)_0%,transparent_100%)] opacity-10" />
        <Viewfinder inset={-10} size={18} />
        <div className="rounded-[var(--radius-cover)] border border-line bg-surface-raised/85 px-6 py-8 text-center backdrop-blur-md sm:px-8 sm:py-10">
          {studio && (
            <StudioLogo
              name={studio.name}
              logoUrl={studio.logoUrl}
              imageClassName="mx-auto max-h-14 max-w-[200px]"
              textClassName="text-body tracking-[0.3em] text-ink"
            />
          )}
          <div className={studio ? "mt-8" : ""}>{children}</div>
        </div>
      </div>

      <Link
        href="/"
        className="absolute inset-x-0 bottom-6 mx-auto flex w-max items-center gap-2 rounded-full px-3 py-1.5 text-ink-muted transition-colors hover:text-ink"
      >
        <span className="type-caption font-normal">Delivered with</span>
        <BrandMark className="size-5" />
        <span className="font-heading text-body leading-none font-medium tracking-[0.06em] text-ink uppercase">Framesly</span>
      </Link>
    </main>
  )
}

/** Shown when the gallery has a key and this browser hasn't unlocked it. */
export function PasswordScreen({ slug, title, studio }: { slug: string; title: string; studio: Studio }) {
  const router = useRouter()
  const [key, setKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      setError(null)
      const res = await fetch(`/api/g/${slug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: key.trim() }),
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
    <Shell studio={studio} backdrop={title}>
      <p className="type-label text-ink-muted">Private gallery</p>
      <h1 className="mt-2 type-heading-1 text-balance text-ink">{title}</h1>
      <p className="mt-2 text-pretty text-ink-muted">Enter the gallery key {studio.name} sent you.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 text-left" noValidate>
        <PasswordField
          label="Gallery key"
          what="key"
          name="key"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value)}
          error={error}
        />
        <Button type="submit" size="lg" className="w-full" disabled={pending || !key.trim()}>
          {pending ? "Checking…" : "View the photos"}
        </Button>
      </form>
    </Shell>
  )
}

/** Shown while the photographer has the gallery unpublished. Publishing again brings the same link back. */
export function UnpublishedScreen({ studio }: { studio: Studio }) {
  return (
    <Shell studio={studio} backdrop={studio.name}>
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
    <Shell backdrop="Framesly">
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
    <Shell studio={studio} backdrop={studio.name}>
      <h1 className="type-heading-1 text-balance text-ink">This gallery has expired</h1>
      <p className="mt-2 text-pretty text-ink-muted">
        The link was open for a limited time. Ask {studio.name} if you&apos;d like it opened again.
      </p>
    </Shell>
  )
}
