import { z } from "zod"

import { getMembership } from "@/lib/auth/dal"
import { ACCEPTED_IMAGE_TYPES, MAX_FILES_PER_BATCH, MAX_ORIGINAL_BYTES } from "@/lib/uploads"
import { originalKey, presignPut, thumbKey, webKey } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

const bodySchema = z.object({
  galleryId: z.uuid(),
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        size: z.number().int().positive().max(MAX_ORIGINAL_BYTES),
        type: z.enum(Object.keys(ACCEPTED_IMAGE_TYPES) as [string, ...string[]]),
      })
    )
    .min(1)
    .max(MAX_FILES_PER_BATCH),
  /** Failed photos being retried: their old rows are dropped so counts stay accurate. */
  replaces: z.array(z.uuid()).max(MAX_FILES_PER_BATCH).optional(),
})

/**
 * Step 3 of an upload: the photographer's browser lists the files it is about
 * to send. We check they own the gallery, record one `photos` row per file
 * (status "uploading") and hand back three presigned URLs each: the original,
 * the 2048px web copy and the 800px grid thumbnail. The files then go straight from the browser to R2.
 */
export async function POST(request: Request) {
  const membership = await getMembership()
  if (!membership) return Response.json({ error: "Sign in to upload." }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Those files can't be uploaded. Use JPEG, PNG, WebP, AVIF or HEIC under 200 MB." }, { status: 400 })
  const { galleryId, files, replaces } = parsed.data

  const supabase = await createClient()
  const { data: gallery } = await supabase.from("galleries").select("id, studio_id").eq("id", galleryId).maybeSingle()
  if (!gallery || gallery.studio_id !== membership.studio.id) return Response.json({ error: "Gallery not found." }, { status: 404 })

  // Choosing the same files again after a dropped connection: clear their stale rows (failed, or
  // stuck "uploading" for a quarter of an hour) so counts stay accurate and nothing is duplicated.
  const { data: unfinished } = await supabase
    .from("photos")
    .select("id, original_name, bytes, status, created_at")
    .eq("gallery_id", galleryId)
    .in("status", ["uploading", "failed"])
    .in("original_name", [...new Set(files.map((f) => f.name))])
  const incoming = new Set(files.map((f) => `${f.name}|${f.size}`))
  const staleBefore = Date.now() - 15 * 60 * 1000
  const stale = (unfinished ?? []).filter((r) => incoming.has(`${r.original_name}|${r.bytes}`) && (r.status === "failed" || new Date(r.created_at).getTime() < staleBefore))
  if (stale.length) await supabase.from("photos").delete().in("id", stale.map((r) => r.id))

  if (replaces?.length) await supabase.from("photos").delete().eq("gallery_id", galleryId).eq("status", "failed").in("id", replaces)

  const rows = files.map((f) => {
    const id = crypto.randomUUID()
    return {
      id,
      gallery_id: galleryId,
      original_name: f.name,
      r2_key: originalKey(galleryId, id, ACCEPTED_IMAGE_TYPES[f.type]),
      web_key: webKey(galleryId, id),
      bytes: f.size,
      mime: f.type,
    }
  })

  const { error } = await supabase.from("photos").insert(rows)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  try {
    const items = await Promise.all(
      rows.map(async (row) => ({
        photoId: row.id,
        originalUrl: await presignPut(row.r2_key, row.mime),
        webUrl: await presignPut(row.web_key, "image/jpeg"),
        thumbUrl: await presignPut(thumbKey(galleryId, row.id), "image/jpeg"),
      }))
    )
    return Response.json({ items })
  } catch (err) {
    // Usually missing or wrong R2_* variables on the server. Don't leave the
    // rows stuck as "uploading": mark them failed so they can be retried.
    console.error("[presign] could not sign R2 upload URLs:", err)
    await supabase
      .from("photos")
      .update({ status: "failed", error: "Storage isn't available. Try again later." })
      .in("id", rows.map((r) => r.id))
    return Response.json({ error: "Uploads aren't available right now. Try again later." }, { status: 503 })
  }
}
