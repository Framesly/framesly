import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

import { signMediaUrl } from "@/lib/media"
import { createAdminClient } from "@/lib/supabase/admin"
import { studioAssetUrl } from "@/lib/supabase/env"

/*
 * Client galleries (build map stage 3): what a couple can see at
 * framesly.app/g/<slug>. Clients have no account, so this reads with the
 * service role and does every check itself, in this order:
 *   not published → "not_found"   (404)
 *   past expires_at → "expired"   (410)
 *   password set, no valid unlock cookie → "locked" (401)
 * Only then are photo links signed. Nothing here is exposed to the browser
 * except the returned view.
 */

export const UNLOCK_TTL = 24 * 60 * 60 // seconds an unlocked gallery stays open in that browser
const unlockCookie = (galleryId: string) => `fg_${galleryId.replace(/-/g, "")}`

type GalleryRow = {
  id: string
  studio_id: string
  title: string
  event_date: string | null
  public_slug: string | null
  published_at: string | null
  expires_at: string | null
  cover_photo_id: string | null
}

export type ClientPhoto = {
  id: string
  name: string
  width: number | null
  height: number | null
  sectionId: string | null
  src: string
  download: string
}

export type ClientGalleryView = {
  id: string
  slug: string
  title: string
  eventDate: string | null
  studio: { name: string; logoUrl: string | null; brandColor: string }
  coverId: string | null
  sections: { id: string; name: string }[]
  photos: ClientPhoto[]
  /** Unix seconds when the photo links stop working; the page refreshes before then. */
  linksExpireAt: number
}

export type ClientGalleryResult =
  | { status: "not_found" }
  | { status: "expired"; studio: { name: string; logoUrl: string | null } }
  | { status: "locked"; title: string; studio: { name: string; logoUrl: string | null; brandColor: string } }
  | { status: "ok"; gallery: ClientGalleryView }

/** Look the gallery up by slug once; everything after works with its id. */
async function findPublished(slug: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(slug)) return null
  const db = createAdminClient()
  const { data } = await db
    .from("galleries")
    .select("id, studio_id, title, event_date, public_slug, published_at, expires_at, cover_photo_id")
    .eq("public_slug", slug)
    .not("published_at", "is", null)
    .maybeSingle()
  return (data as GalleryRow | null) ?? null
}

async function studioOf(studioId: string) {
  const db = createAdminClient()
  const { data } = await db.from("studios").select("name, logo_path, brand_color").eq("id", studioId).maybeSingle()
  return { name: data?.name ?? "Your photographer", logoUrl: studioAssetUrl(data?.logo_path), brandColor: data?.brand_color ?? "#F2A93B" }
}

/** The stored hash's updated_at is part of the token, so changing the password locks everyone out again. */
async function passwordSecret(galleryId: string) {
  const db = createAdminClient()
  const { data } = await db.from("gallery_secrets").select("password_hash, updated_at").eq("gallery_id", galleryId).maybeSingle()
  return data
}

function unlockToken(galleryId: string, version: string, exp: number) {
  const secret = process.env.MEDIA_TOKEN_SECRET
  if (!secret) throw new Error("MEDIA_TOKEN_SECRET is not set.")
  const sig = createHmac("sha256", secret).update(`unlock:${galleryId}:${version}:${exp}`).digest("base64url")
  return `${exp}.${sig}`
}

function validUnlock(galleryId: string, version: string, value: string | undefined) {
  if (!value) return false
  const [expRaw, sig] = value.split(".")
  const exp = Number(expRaw)
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000) || !sig) return false
  const expected = unlockToken(galleryId, version, exp).split(".")[1]
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Full load with all checks. Used by GET /api/g/[slug] and the /g/[slug] page. */
export async function loadClientGallery(slug: string): Promise<ClientGalleryResult> {
  const gallery = await findPublished(slug)
  if (!gallery) return { status: "not_found" }

  const studio = await studioOf(gallery.studio_id)
  if (gallery.expires_at && new Date(gallery.expires_at).getTime() <= Date.now()) {
    return { status: "expired", studio: { name: studio.name, logoUrl: studio.logoUrl } }
  }

  // Decide from the secrets table, not galleries.has_password (a display hint the photographer can edit).
  const secret = await passwordSecret(gallery.id)
  if (secret) {
    const jar = await cookies()
    if (!validUnlock(gallery.id, secret.updated_at, jar.get(unlockCookie(gallery.id))?.value)) {
      return { status: "locked", title: gallery.title, studio }
    }
  }

  const db = createAdminClient()
  const [{ data: sections }, { data: photos }] = await Promise.all([
    db.from("sections").select("id, name, sort_order").eq("gallery_id", gallery.id).order("sort_order"),
    db
      .from("photos")
      .select("id, original_name, web_key, r2_key, width, height, section_id, taken_at, created_at")
      .eq("gallery_id", gallery.id)
      .eq("status", "ready")
      .not("web_key", "is", null)
      .order("taken_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ])

  const linksExpireAt = Math.floor(Date.now() / 1000) + 60 * 60
  return {
    status: "ok",
    gallery: {
      id: gallery.id,
      slug: gallery.public_slug!,
      title: gallery.title,
      eventDate: gallery.event_date,
      studio,
      coverId: gallery.cover_photo_id,
      sections: (sections ?? []).map((s) => ({ id: s.id, name: s.name })),
      photos: (photos ?? []).map((p) => ({
        id: p.id,
        name: p.original_name,
        width: p.width,
        height: p.height,
        sectionId: p.section_id,
        src: signMediaUrl(p.web_key!),
        download: signMediaUrl(p.r2_key, undefined, { download: true, name: p.original_name }),
      })),
      linksExpireAt,
    },
  }
}

/** Check a password and, if right, set the gallery's unlock cookie (24h). */
export async function unlockGallery(slug: string, password: string): Promise<"ok" | "wrong" | "not_found" | "expired" | "open"> {
  const gallery = await findPublished(slug)
  if (!gallery) return "not_found"
  if (gallery.expires_at && new Date(gallery.expires_at).getTime() <= Date.now()) return "expired"
  const secret = await passwordSecret(gallery.id)
  if (!secret) return "open"

  const { default: bcrypt } = await import("bcryptjs")
  if (!(await bcrypt.compare(password, secret.password_hash))) return "wrong"

  const exp = Math.floor(Date.now() / 1000) + UNLOCK_TTL
  const jar = await cookies()
  jar.set(unlockCookie(gallery.id), unlockToken(gallery.id, secret.updated_at, exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_TTL,
  })
  return "ok"
}
