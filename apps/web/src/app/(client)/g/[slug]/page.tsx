import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ExpiredScreen, PasswordScreen } from "@/components/gallery/gallery-gate"
import { LiveGallery } from "@/components/gallery/live-gallery"
import { loadClientGallery } from "@/lib/data/client-gallery"

// Private client galleries are never indexed.
export const metadata: Metadata = { title: "Your gallery", robots: { index: false, follow: false } }

/**
 * framesly.app/g/<slug>: the client gallery a couple opens.
 * The server checks published / expiry / password before any photo link is
 * made; the browser never talks to Supabase or R2 directly.
 */
export default function ClientGalleryPage({ params }: PageProps<"/g/[slug]">) {
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <Gate params={params} />
    </Suspense>
  )
}

async function Gate({ params }: { params: PageProps<"/g/[slug]">["params"] }) {
  const { slug } = await params
  const result = await loadClientGallery(slug)
  switch (result.status) {
    case "not_found":
      notFound()
    case "expired":
      return <ExpiredScreen studio={result.studio} />
    case "locked":
      return <PasswordScreen slug={slug} title={result.title} studio={result.studio} />
    case "ok":
      return <LiveGallery slug={slug} initial={result.gallery} />
  }
}

function GallerySkeleton() {
  return (
    <div className="min-h-dvh bg-surface" aria-busy="true" aria-label="Loading gallery">
      <div className="h-[88svh] min-h-[520px] animate-pulse bg-fixed-dark" />
    </div>
  )
}
