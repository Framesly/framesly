import { ImageResponse } from "next/og"

import { brandIcon } from "@/lib/brand-icon"

const SIZES = new Set([192, 512])

/** Home-screen icons for the web app manifest: /pwa-icon/192 and /pwa-icon/512 (add ?maskable for the maskable variant). */
export async function GET(request: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size: raw } = await ctx.params
  const size = Number(raw)
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 })
  const maskable = new URL(request.url).searchParams.has("maskable")
  return new ImageResponse(brandIcon(size, { maskable }), {
    width: size,
    height: size,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  })
}
