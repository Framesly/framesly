import type { Metadata } from "next"

import { StudioSettingsForm } from "@/components/studio/studio-settings-form"
import { requireStudio } from "@/lib/auth/dal"
import { studioAssetUrl } from "@/lib/supabase/env"

export const metadata: Metadata = { title: "Studio" }

/** Studio profile and branding: name, address, colour, logo. */
export default async function StudioSettingsPage() {
  const { studio, role } = await requireStudio()
  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <h1 className="type-heading-1 md:type-display-l">Studio</h1>
      <p className="mt-3 max-w-xl text-ink-muted">Your studio’s name, address and brand appear on every gallery you deliver.</p>
      <div className="mt-10">
        <StudioSettingsForm
          studio={{
            id: studio.id,
            name: studio.name,
            slug: studio.slug,
            brandColor: studio.brand_color,
            region: studio.region,
            logoUrl: studioAssetUrl(studio.logo_path),
            isOwner: role === "owner",
          }}
        />
      </div>
    </div>
  )
}
