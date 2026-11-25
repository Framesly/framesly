import { loadClientGallery } from "@/lib/data/client-gallery"

/**
 * GET /api/g/[slug]: the client gallery for a couple's browser.
 * 404 not published · 410 expired · 401 password needed · 200 gallery with
 * 1-hour signed photo links. Never returns photo links in the first three cases.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/g/[slug]">) {
  const { slug } = await ctx.params
  const result = await loadClientGallery(slug)
  const noStore = { "Cache-Control": "private, no-store" }

  switch (result.status) {
    case "not_found":
      return Response.json({ error: "This gallery isn't available." }, { status: 404, headers: noStore })
    case "expired":
      return Response.json({ error: "This gallery has expired.", studio: result.studio }, { status: 410, headers: noStore })
    case "locked":
      return Response.json({ error: "This gallery needs a password.", title: result.title, studio: result.studio }, { status: 401, headers: noStore })
    case "ok":
      return Response.json(result.gallery, { headers: noStore })
  }
}
