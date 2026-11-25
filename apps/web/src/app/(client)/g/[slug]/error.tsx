"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

/** Shown instead of the framework's error page when a client gallery fails to load. */
export default function GalleryError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="theme-print grid min-h-dvh place-items-center bg-surface px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="type-heading-1 text-ink">This gallery couldn&apos;t open</h1>
        <p className="mt-2 text-ink-muted">Something went wrong on our side. Try again in a moment.</p>
        {error.digest && <p className="mt-2 type-caption font-normal text-ink-muted">Reference: {error.digest}</p>}
        <Button type="button" className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
        <p className="mt-16 type-label text-ink-muted">Delivered with Framesly</p>
      </div>
    </main>
  )
}
