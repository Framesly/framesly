import { z } from "zod"

import { unlockGallery } from "@/lib/data/client-gallery"

const body = z.object({ password: z.string().min(1).max(72) })

/**
 * POST /api/g/[slug]/unlock { password }: compares with the bcrypt hash and,
 * if right, sets an httpOnly cookie that opens this gallery for 24 hours.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/g/[slug]/unlock">) {
  const { slug } = await ctx.params
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Enter the password." }, { status: 400 })

  const result = await unlockGallery(slug, parsed.data.password)
  switch (result) {
    case "ok":
    case "open":
      return Response.json({ ok: true })
    case "wrong":
      // Small fixed delay slows down guessing.
      await new Promise((r) => setTimeout(r, 600))
      return Response.json({ error: "That password isn't right. Check with your photographer." }, { status: 401 })
    case "expired":
      return Response.json({ error: "This gallery has expired." }, { status: 410 })
    case "not_found":
      return Response.json({ error: "This gallery isn't available." }, { status: 404 })
  }
}
