import bcrypt from "bcryptjs"

import { getMembership } from "@/lib/auth/dal"
import { siteOrigin } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/server"
import { fieldErrors, publicSlugSchema, publishGallerySchema } from "@/lib/validation"

/*
 * Publishing a gallery (build map stage 1). The photographer must belong to
 * the gallery's studio; the database functions check that again (security
 * definer + is_member), so a forged request can't publish someone else's work.
 * Passwords are bcrypt-hashed here and only the hash reaches the database.
 */

const BCRYPT_COST = 10

type Ctx = RouteContext<"/api/galleries/[galleryId]/publish">

/** GET ?slug=… → is this link name free for this gallery? */
export async function GET(request: Request, ctx: Ctx) {
  if (!(await getMembership())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const { galleryId } = await ctx.params
  const slug = publicSlugSchema.safeParse(new URL(request.url).searchParams.get("slug") ?? "")
  if (!slug.success) return Response.json({ available: false, message: slug.error.issues[0].message })
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("public_slug_available", { p_slug: slug.data, p_gallery_id: galleryId })
  if (error) return Response.json({ error: "Couldn't check that name. Try again." }, { status: 500 })
  return Response.json({ available: data, message: data ? "Available." : "That link name is taken. Try another." })
}

/** POST → publish, or update the link name, password or expiry of a published gallery. */
export async function POST(request: Request, ctx: Ctx) {
  if (!(await getMembership())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const { galleryId } = await ctx.params

  const parsed = publishGallerySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) }, { status: 400 })
  const { slug, password, removePassword, expiresAt } = parsed.data

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("publish_gallery", {
    p_gallery_id: galleryId,
    p_slug: slug,
    p_password_hash: passwordHash,
    p_remove_password: removePassword && !password,
    p_expires_at: expiresAt,
  })

  if (error) {
    if (error.code === "23505") return Response.json({ error: "That link name is taken. Try another.", fieldErrors: { slug: "That link name is taken. Try another." } }, { status: 409 })
    if (error.code === "42501") return Response.json({ error: "Gallery not found." }, { status: 404 })
    if (error.code === "22023") {
      const expiry = error.message.toLowerCase().includes("expiry")
      const message = expiry ? "Choose an expiry date in the future." : "Use 3 to 60 letters, numbers or hyphens."
      return Response.json({ error: message, fieldErrors: { [expiry ? "expiresAt" : "slug"]: message } }, { status: 400 })
    }
    console.error("[publish]", error)
    return Response.json({ error: "Couldn't publish. Try again." }, { status: 500 })
  }

  const row = data?.[0]
  if (!row) return Response.json({ error: "Gallery not found." }, { status: 404 })
  return Response.json({
    url: `${await siteOrigin()}/g/${row.public_slug}`,
    slug: row.public_slug,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    hasPassword: row.has_password,
  })
}

/** DELETE → unpublish (back to draft). The link name stays reserved for this gallery. */
export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await getMembership())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const { galleryId } = await ctx.params
  const supabase = await createClient()
  const { error } = await supabase.rpc("unpublish_gallery", { p_gallery_id: galleryId })
  if (error) return Response.json({ error: error.code === "42501" ? "Gallery not found." : "Couldn't unpublish. Try again." }, { status: error.code === "42501" ? 404 : 500 })
  return Response.json({ ok: true })
}
