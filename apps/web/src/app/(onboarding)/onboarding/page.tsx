import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { getMembership, requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Set up your studio", robots: { index: false } }

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingGate />
    </Suspense>
  )
}

/** Signed in, no studio yet → the wizard. Already onboarded → dashboard. */
async function OnboardingGate() {
  const user = await requireUser("/onboarding")
  const membership = await getMembership()
  if (membership) redirect("/galleries")
  return <OnboardingWizard firstName={user.fullName.split(" ")[0] ?? ""} />
}

function OnboardingSkeleton() {
  return (
    <div className="grid animate-pulse gap-10 lg:grid-cols-2" aria-hidden>
      <div className="space-y-4">
        <div className="h-4 w-48 rounded bg-surface-raised" />
        <div className="h-12 w-3/4 rounded bg-surface-raised" />
        <div className="h-11 rounded bg-surface-raised" />
        <div className="h-11 rounded bg-surface-raised" />
      </div>
      <div className="h-[360px] rounded-[var(--radius-cover)] bg-surface-raised" />
    </div>
  )
}
