"use client"

import "./globals.css"

/**
 * Last resort: runs when the root layout itself fails, so it has to bring its
 * own <html> and <body>. Kept plain on purpose: no providers, no fonts, no
 * animation, nothing that could fail the same way.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-surface px-4 text-ink">
        <main role="alert" className="max-w-md text-center">
          <p className="type-label text-ink-muted">Frame 0500 · Something broke</p>
          <h1 className="mt-4 type-heading-1">That frame didn&apos;t develop.</h1>
          <p className="mt-4 text-ink-muted">Something went wrong on our side. Nothing you uploaded was lost. Please try again.</p>
          {error.digest && <p className="mt-3 type-label text-ink-muted">Reference {error.digest}</p>}
          <button type="button" onClick={reset} className="mt-8 h-11 rounded-[var(--radius-control)] bg-safelight px-5 font-semibold text-on-safelight">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
