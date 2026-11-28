"use client"

import { ErrorState } from "@/components/site/error-state"

/** An error inside the photographer's app keeps the sidebar and header; only the page area shows this. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState error={error} reset={reset} homeHref="/galleries" homeLabel="Back to galleries" />
}
