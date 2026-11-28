import type { Metadata } from "next"
import Link from "next/link"

import { NewPasswordForm } from "@/components/auth/password-forms"
import { AvatarPicker } from "@/components/profile/avatar-picker"
import { ProfileForm } from "@/components/profile/profile-form"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { signOutAction } from "@/features/auth/actions"
import { getProfile, requireStudio } from "@/lib/auth/dal"
import { listGalleries } from "@/lib/data/galleries"
import type { MemberRole } from "@/lib/supabase/database.types"
import { studioAssetUrl } from "@/lib/supabase/env"

export const metadata: Metadata = { title: "Profile" }

const roleLabel: Record<MemberRole, string> = { owner: "Owner", editor: "Editor", shooter: "Shooter" }

/** The photographer's own account: who they are, their work at a glance, details, password, sign out. */
export default async function ProfilePage() {
  const [{ user, role, studio }, profile] = await Promise.all([requireStudio(), getProfile()])
  const galleries = await listGalleries(studio.id)
  const fullName = profile?.full_name || user.fullName
  const photos = galleries.reduce((n, g) => n + g.photo_count, 0)
  const delivered = galleries.filter((g) => g.status === "delivered").length

  return (
    <div className="mx-auto max-w-[var(--container-content)]">
      <h1 className="type-heading-1 md:type-display-l">Profile</h1>

      <section aria-label="Your account" className="mt-6 overflow-hidden rounded-[var(--radius-cover)] border border-line bg-surface-raised">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <AvatarPicker userId={user.id} name={fullName} avatarUrl={studioAssetUrl(profile?.avatar_path ?? null)} />
          <div className="min-w-0 sm:ml-auto sm:text-right">
            <p className="truncate type-heading-2 text-ink">{fullName || "Your name"}</p>
            <p className="truncate type-caption font-normal text-ink-muted" translate="no">{user.email}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge tone="info">{roleLabel[role]}</Badge>
              <span className="type-caption text-ink-muted">at {studio.name}</span>
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
          {[
            { label: "Galleries", value: galleries.length },
            { label: "Photos", value: photos },
            { label: "Delivered", value: delivered },
          ].map((m) => (
            <div key={m.label} className="px-5 py-3 sm:px-6">
              <dt className="type-caption font-normal text-ink-muted">{m.label}</dt>
              <dd className="type-metric text-stat leading-8 text-ink">{m.value.toLocaleString("en")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="details-title" className="rounded-[var(--radius-cover)] border border-line bg-surface-raised p-5 sm:p-6">
          <h2 id="details-title" className="type-heading-2">Your details</h2>
          <p className="mt-1 type-caption font-normal text-ink-muted">Your name shows to your team. Couples see your studio, not you.</p>
          <div className="mt-6">
            <ProfileForm fullName={fullName} email={user.email} />
          </div>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="password-title" className="rounded-[var(--radius-cover)] border border-line bg-surface-raised p-5 sm:p-6">
            <h2 id="password-title" className="type-heading-2">Password</h2>
            <p className="mt-1 type-caption font-normal text-ink-muted">Signed in with Google? A password lets you log in with email too.</p>
            <div className="mt-6">
              <NewPasswordForm compact />
            </div>
          </section>

          <section aria-label="Studio and session" className="divide-y divide-line overflow-hidden rounded-[var(--radius-cover)] border border-line bg-surface-raised">
            <Link href="/studio" className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-overlay sm:px-6">
              <Icon name="settings" className="size-5 text-ink-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-ink">Studio and branding</span>
                <span className="block truncate type-caption font-normal text-ink-muted" translate="no">framesly.app/{studio.slug}</span>
              </span>
              <Icon name="chevron-right" className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-overlay sm:px-6">
                <Icon name="arrow-right" className="size-5 text-ink-muted" />
                <span className="flex-1">
                  <span className="block text-ink">Log out</span>
                  <span className="block type-caption font-normal text-ink-muted">Ends your session on this device.</span>
                </span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
