import { z } from "zod"

import { getMembership } from "@/lib/auth/dal"
import { deleteKeys, objectSize } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

const bodySchema = z.object({
  galleryId: z.uuid(),
  photos: z
    .array(
      z.object({
        id: z.uuid(),
        ok: z.boolean(),
        /** The photographer cancelled this upload: drop the row and any partial files. */
        cancelled: z.boolean().optional(),
        width: z.number().int().positive().max(100_000).optional(),
        height: z.number().int().positive().max(100_000).optional(),
        error: z.string().max(300).optional(),
      })
    )
    .min(1)
    .max(100),
})

/**
 * After the browser has uploaded the files: confirm each one really is on R2
 * (never trust the browser's word) and mark the photo ready, or failed.
 * RLS limits the update to photos in the signed-in photographer's studio.
 */
export async function POST(request: Request) {
  const membership = await getMembership()
  if (!membership) return Response.json({ error: "Sign in to upload." }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 })
  const { galleryId, photos } = parsed.data

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("photos")
    .select("id, r2_key, web_key, bytes")
    .eq("gallery_id", galleryId)
    .in("id", photos.map((p) => p.id))
  const byId = new Map((rows ?? []).map((r) => [r.id, r]))

  const results = await Promise.all(
    photos.map(async (p) => {
      const row = byId.get(p.id)
      if (!row) return { id: p.id, status: "failed" as const }
      if (p.cancelled) {
        // Only unfinished rows can be dropped this way; a ready photo is never deleted here.
        const { data: gone } = await supabase.from("photos").delete().eq("id", row.id).in("status", ["uploading", "failed"]).select("id")
        if (gone?.length) await deleteKeys([row.r2_key, ...(row.web_key ? [row.web_key] : [])]).catch(() => {})
        return { id: row.id, status: "cancelled" as const }
      }
      if (!p.ok) {
        await supabase.from("photos").update({ status: "failed", error: p.error ?? "Upload failed" }).eq("id", row.id)
        return { id: row.id, status: "failed" as const }
      }
      const [original, web] = await Promise.all([objectSize(row.r2_key), row.web_key ? objectSize(row.web_key) : Promise.resolve(null)])
      if (original === null || web === null) {
        await supabase.from("photos").update({ status: "failed", error: "File didn't reach storage" }).eq("id", row.id)
        return { id: row.id, status: "failed" as const }
      }
      await supabase
        .from("photos")
        .update({ status: "ready", error: null, width: p.width ?? null, height: p.height ?? null })
        .eq("id", row.id)
      return { id: row.id, status: "ready" as const }
    })
  )
  return Response.json({ results })
}
