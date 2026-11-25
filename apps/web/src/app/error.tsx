"use client"

import { ErrorState } from "@/components/site/error-state"

/** Catches errors in any page that has no closer boundary. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <ErrorState error={error} reset={reset} fullPage />
    </main>
  )
}
