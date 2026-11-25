"use client"

import { useEffect } from "react"

import { ContactEmail } from "@/components/site/social-links"
import { Button, ButtonLink } from "@/components/ui/button"
import { EdgeLabel } from "@/components/ui/card"
import { Viewfinder } from "@/components/ui/viewfinder"

/**
 * What people see when something breaks, instead of the framework's error
 * page. Plain words, a way to try again, and a reference code for support.
 * `fullPage` is for the site root; inside the app it sits in the page.
 */
export function ErrorState({
  error,
  reset,
  fullPage = false,
  homeHref = "/",
  homeLabel = "Back to Framesly",
}: {
  error: Error & { digest?: string }
  reset: () => void
  fullPage?: boolean
  homeHref?: string
  homeLabel?: string
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className={fullPage ? "grain flex min-h-dvh items-center justify-center px-4" : "flex min-h-[60dvh] items-center justify-center px-2"}>
      <div className="relative w-full max-w-lg p-10 text-center sm:p-14">
        <Viewfinder size={24} />
        <EdgeLabel>Frame 0500 · Something broke</EdgeLabel>
        <h1 className="mt-4 type-heading-1 md:type-display-l">That frame didn&apos;t develop.</h1>
        <p className="mx-auto mt-4 max-w-sm text-ink-muted">
          Something went wrong on our side. Nothing you uploaded was lost. Try again, and if it keeps happening, tell us.
        </p>
        {error.digest && <p className="mt-3 type-label text-ink-muted">Reference {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href={homeHref} variant="secondary">
            {homeLabel}
          </ButtonLink>
        </div>
        <p className="mt-6 type-caption font-normal text-ink-muted">
          Still stuck? <ContactEmail className="font-semibold text-ink" />
        </p>
      </div>
    </div>
  )
}
