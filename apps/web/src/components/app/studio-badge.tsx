import { getMembership } from "@/lib/auth/dal"
import { Skeleton } from "@/components/ui/skeleton"
import { readableOn } from "@/lib/color"
import { studioAssetUrl } from "@/lib/supabase/env"

/** Whole days left on the free trial (0 once it has ended). */
function trialDaysLeft(endsAt: string, now = Date.now()) {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 86_400_000))
}

/** Studio name, logo and trial status in the app header. */
export async function StudioBadge() {
  const membership = await getMembership()
  if (!membership) return <StudioBadgeSkeleton />
  const { studio } = membership
  const logo = studioAssetUrl(studio.logo_path)
  const daysLeft = trialDaysLeft(studio.trial_ends_at)
  const initials = studio.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-line font-heading text-caption font-bold"
        // Initials sit on the studio's own colour, so pick the ink that reads on it (4.5:1 or better).
        style={logo ? { background: "var(--surface-raised)" } : { background: studio.brand_color, color: readableOn(studio.brand_color) }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- small Storage-hosted logo, any format incl. SVG
          <img src={logo} alt="" className="max-h-7 max-w-7 object-contain" />
        ) : (
          initials
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate type-caption text-ink">{studio.name}</p>
        <p className="truncate type-caption font-normal text-ink-muted">
          {studio.plan === "trial" ? (daysLeft > 0 ? `Free trial · ${daysLeft} days left` : "Trial ended") : studio.plan}
        </p>
      </div>
    </div>
  )
}

export function StudioBadgeSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
