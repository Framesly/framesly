import { z } from "zod"

import { getMembership } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"

const bodySchema = z.object({
  galleryId: z.uuid(),
  files: z.array(z.object({ name: z.string().trim().min(1).max(255), size: z.number().int().positive() })).min(1).max(500),
})

/**
 * Before uploading: which of these files are already in the gallery (same
 * name and size, and finished)? The browser skips them, so choosing the same
 * folder again after a dropped connection only uploads what is missing.
 * RLS limits the lookup to the signed-in photographer's studio.
 */
export async function POST(request: Request) {
  const membership = await getMembership()
  if (!membership) return Response.json({ error: "Sign in to upload." }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 })
  const { galleryId, files } = parsed.data

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("photos")
    .select("original_name, bytes")
    .eq("gallery_id", galleryId)
    .eq("status", "ready")
    .in("original_name", [...new Set(files.map((f) => f.name))])
  if (error) return Response.json({ error: "Couldn't check the gallery." }, { status: 500 })

  const have = new Set((rows ?? []).map((r) => `${r.original_name}|${r.bytes}`))
  const existing = files.flatMap((f, i) => (have.has(`${f.name}|${f.size}`) ? [i] : []))
  return Response.json({ existing })
}
