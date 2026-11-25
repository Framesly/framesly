import { z } from "zod"

import { setFavourite } from "@/lib/data/client-gallery"

const body = z.object({ photoId: z.string(), on: z.boolean() })

/**
 * POST /api/g/[slug]/favourite { photoId, on }: heart or un-heart a photo for
 * this browser (anonymous visitor cookie). Same checks as viewing the gallery.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/g/[slug]/favourite">) {
  const { slug } = await ctx.params
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 })

  const result = await setFavourite(slug, parsed.data.photoId, parsed.data.on)
  switch (result) {
    case "ok":
      return Response.json({ ok: true, on: parsed.data.on })
    case "locked":
      return Response.json({ error: "This gallery needs a password." }, { status: 401 })
    case "expired":
      return Response.json({ error: "This gallery has expired." }, { status: 410 })
    case "no_photo":
    case "not_found":
      return Response.json({ error: "That photo isn't in this gallery." }, { status: 404 })
  }
}
