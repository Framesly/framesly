import bcrypt from "bcryptjs"
import { z } from "zod"

import { getMembership } from "@/lib/auth/dal"
import { encryptGalleryKey } from "@/lib/gallery-key"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const body = z.object({ key: z.string().min(1).max(72) })

/**
 * POST /api/galleries/[galleryId]/key { key }: make a key set before keys were
 * stored readably visible again. The photographer types the key they set; it
 * is checked against the stored hash and, if it matches, saved encrypted next
 * to it. The key itself doesn't change, so couples who already unlocked the
 * gallery stay unlocked.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/galleries/[galleryId]/key">) {
  if (!(await getMembership())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const { galleryId } = await ctx.params
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Type the key you set." }, { status: 400 })

  // RLS returns the gallery only to members of its studio.
  const supabase = await createClient()
  const { data: gallery } = await supabase.from("galleries").select("id").eq("id", galleryId).maybeSingle()
  if (!gallery) return Response.json({ error: "Gallery not found." }, { status: 404 })

  // gallery_secrets is readable only with the service role.
  const admin = createAdminClient()
  const { data: secret } = await admin.from("gallery_secrets").select("password_hash").eq("gallery_id", galleryId).maybeSingle()
  if (!secret) return Response.json({ error: "This gallery has no key." }, { status: 404 })

  if (!(await bcrypt.compare(parsed.data.key, secret.password_hash))) {
    await new Promise((r) => setTimeout(r, 600)) // slows down guessing
    return Response.json({ error: "That isn't the key set for this gallery. Reset it to get a new one." }, { status: 400 })
  }

  const { error } = await admin.from("gallery_secrets").update({ password_cipher: encryptGalleryKey(parsed.data.key) }).eq("gallery_id", galleryId)
  if (error) return Response.json({ error: "Couldn't save. Try again." }, { status: 500 })
  return Response.json({ key: parsed.data.key })
}
