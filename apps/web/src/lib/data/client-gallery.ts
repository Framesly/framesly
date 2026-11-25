import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

import { mediaExpiry, signMediaUrl, thumbKeyOf } from "@/lib/media"
import { createAdminClient } from "@/lib/supabase/admin"
import { studioAssetUrl } from "@/lib/supabase/env"

/*
 * Client galleries: what a couple can see at
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
  /** 800px grid copy; may be missing for photos uploaded before thumbnails existed */
  thumb: string
  /** 2048px web copy for the viewer */
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
  /** Photo ids this browser has hearted. */
  favourites: string[]
}

export type ClientGalleryResult =
  | { status: "not_found" }
  | { status: "expired"; studio: { name: string; logoUrl: string | null; brandColor: string } }
  | { status: "locked"; title: string; studio: { name: string; logoUrl: string | null; brandColor: string } }
  | { status: "ok"; gallery: ClientGalleryView }

type Secret = { password_hash: string; updated_at: string }
type Published = GalleryRow & { studio: { name: string; logoUrl: string | null; brandColor: string }; secret: Secret | null }

/**
 * The published gallery for a slug, with its studio's branding and its key
 * hash, in one query. The secret's updated_at is part of the unlock token, so
 * changing the key locks everyone out again.
 */
async function findPublished(slug: string): Promise<Published | null> {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(slug)) return null
  const db = createAdminClient()
  const { data } = await db
    .from("galleries")
    .select("id, studio_id, title, event_date, public_slug, published_at, expires_at, cover_photo_id, studios(name, logo_path, brand_color), gallery_secrets(password_hash, updated_at)")
    .eq("public_slug", slug)
    .not("published_at", "is", null)
    .maybeSingle()
  if (!data) return null
  const row = data as unknown as GalleryRow & {
    studios: { name: string; logo_path: string | null; brand_color: string } | null
    gallery_secrets: Secret | Secret[] | null
  }
  const { studios: s, gallery_secrets: sec, ...gallery } = row
  return {
    ...gallery,
    studio: { name: s?.name ?? "Your photographer", logoUrl: studioAssetUrl(s?.logo_path), brandColor: s?.brand_color ?? "#F2A93B" },
    secret: Array.isArray(sec) ? (sec[0] ?? null) : sec,
  }
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

const VISITOR_COOKIE = "fv"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Anonymous id for this browser (favourites). Created on first heart. */
async function visitorId(create: boolean) {
  const jar = await cookies()
  const current = jar.get(VISITOR_COOKIE)?.value
  if (current && UUID_RE.test(current)) return current
  if (!create) return null
  const id = crypto.randomUUID()
  // Normally set by proxy.ts when the gallery page loads; this is the fallback.
  jar.set(VISITOR_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60 })
  return id
}

type Access =
  | { status: "not_found" }
  | { status: "expired"; studio: { name: string; logoUrl: string | null; brandColor: string } }
  | { status: "locked"; title: string; studio: { name: string; logoUrl: string | null; brandColor: string } }
  | { status: "ok"; gallery: GalleryRow; studio: { name: string; logoUrl: string | null; brandColor: string } }

/**
 * Can this browser see the gallery right now? The one place the rules live:
 * published, not expired, and unlocked if it has a password. Photo links and
 * favourites both go through it.
 */
async function checkAccess(slug: string): Promise<Access> {
  const found = await findPublished(slug)
  if (!found) return { status: "not_found" }
  const { studio, secret, ...gallery } = found

  if (gallery.expires_at && new Date(gallery.expires_at).getTime() <= Date.now()) {
    return { status: "expired", studio }
  }

  // Decide from the secrets table, not galleries.has_password (a display hint the photographer can edit).
  if (secret) {
    const jar = await cookies()
    if (!validUnlock(gallery.id, secret.updated_at, jar.get(unlockCookie(gallery.id))?.value)) {
      return { status: "locked", title: gallery.title, studio }
    }
  }
  return { status: "ok", gallery, studio }
}

/** Full load with all checks. Used by GET /api/g/[slug] and the /g/[slug] page. */
export async function loadClientGallery(slug: string): Promise<ClientGalleryResult> {
  const access = await checkAccess(slug)
  if (access.status !== "ok") return access
  const { gallery, studio } = access
  const visitor = await visitorId(false)

  const db = createAdminClient()
  const [{ data: sections }, { data: photos }, { data: picks }] = await Promise.all([
    db.from("sections").select("id, name, sort_order").eq("gallery_id", gallery.id).order("sort_order"),
    readPhotos(gallery.id),
    visitor
      ? db.from("selections").select("photo_id").eq("gallery_id", gallery.id).eq("visitor_id", visitor)
      : Promise.resolve({ data: [] as { photo_id: string }[] }),
  ])

  const linksExpireAt = mediaExpiry()
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
        thumb: signMediaUrl(thumbKeyOf(p.web_key!)),
        src: signMediaUrl(p.web_key!),
        download: signMediaUrl(p.r2_key, undefined, { download: true, name: p.original_name }),
      })),
      linksExpireAt,
      favourites: (picks ?? []).map((p) => p.photo_id),
    },
  }
}

/** The API returns at most this many rows per request. */
const PAGE = 1000

/**
 * Every ready photo of the gallery, in display order: the photographer's
 * order first (photos.sort_order), then capture time, then upload time.
 * Big weddings exceed one page: the first page also returns the total, and
 * the remaining pages are fetched in parallel.
 */
async function readPhotos(galleryId: string) {
  const db = createAdminClient()
  const page = (from: number, count: boolean) =>
    db
      .from("photos")
      .select("id, original_name, web_key, r2_key, width, height, section_id", count ? { count: "exact" } : undefined)
      .eq("gallery_id", galleryId)
      .eq("status", "ready")
      .not("web_key", "is", null)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("taken_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, from + PAGE - 1)
  const first = await page(0, true)
  if (first.error) throw new Error(first.error.message)
  const total = first.count ?? first.data.length
  const rest = await Promise.all(Array.from({ length: Math.ceil(total / PAGE) - 1 }, (_, i) => page((i + 1) * PAGE, false)))
  const failed = rest.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
  return { data: [first.data, ...rest.map((r) => r.data ?? [])].flat() }
}

/** Heart or un-heart a photo for this browser. Same access rules as viewing. */
export async function setFavourite(slug: string, photoId: string, on: boolean): Promise<"ok" | "not_found" | "expired" | "locked" | "no_photo"> {
  if (!UUID_RE.test(photoId)) return "no_photo"
  const access = await checkAccess(slug)
  if (access.status !== "ok") return access.status
  const db = createAdminClient()
  const { data: photo } = await db.from("photos").select("id").eq("id", photoId).eq("gallery_id", access.gallery.id).eq("status", "ready").maybeSingle()
  if (!photo) return "no_photo"

  const visitor = (await visitorId(true))!
  if (on) {
    const { error } = await db.from("selections").upsert({ gallery_id: access.gallery.id, photo_id: photoId, visitor_id: visitor }, { onConflict: "photo_id,visitor_id", ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await db.from("selections").delete().eq("photo_id", photoId).eq("visitor_id", visitor)
    if (error) throw new Error(error.message)
  }
  return "ok"
}

/** Check a password and, if right, set the gallery's unlock cookie (24h). */
export async function unlockGallery(slug: string, password: string): Promise<"ok" | "wrong" | "not_found" | "expired" | "open"> {
  const gallery = await findPublished(slug)
  if (!gallery) return "not_found"
  if (gallery.expires_at && new Date(gallery.expires_at).getTime() <= Date.now()) return "expired"
  const { secret } = gallery
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
