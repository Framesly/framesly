import { loadClientGallery } from "@/lib/data/client-gallery"

/**
 * GET /api/g/[slug]: the client gallery for a couple's browser.
 * 404 unknown or unpublished · 410 expired · 401 password needed · 200 gallery
 * with signed photo links. Never returns photo links in the other cases.
 * `state` tells an open page which screen to switch to.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/g/[slug]">) {
  const { slug } = await ctx.params
  const result = await loadClientGallery(slug)
  const noStore = { "Cache-Control": "private, no-store" }

  switch (result.status) {
    case "not_found":
      return Response.json({ error: "This gallery isn't available.", state: "not_found" }, { status: 404, headers: noStore })
    case "unpublished":
      return Response.json({ error: "This gallery isn't available right now.", state: "unpublished", studio: result.studio }, { status: 404, headers: noStore })
    case "expired":
      return Response.json({ error: "This gallery has expired.", state: "expired", studio: result.studio }, { status: 410, headers: noStore })
    case "locked":
      return Response.json({ error: "This gallery needs a password.", state: "locked", title: result.title, studio: result.studio }, { status: 401, headers: noStore })
    case "ok":
      return Response.json(result.gallery, { headers: noStore })
  }
}
