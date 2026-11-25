/**
 * media.framesly.app: serves gallery photos from R2 (bucket framesly-media,
 * bound as MEDIA) only through signed, expiring links.
 *
 *   /galleries/<galleryId>/<web|original>/<photoId>.<ext>?exp=<unix>&sig=<hmac>
 *
 * sig = base64url( HMAC-SHA256( MEDIA_TOKEN_SECRET, `${path}:${exp}` ) )
 * The website signs links in apps/web/src/lib/media.ts with the same secret.
 * A wrong signature, a changed path or an expired link gets 403.
 *
 * - Web copies are cached at Cloudflare's edge (custom domain only; caching is
 *   a no-op on *.workers.dev).
 * - ?download=1 adds Content-Disposition: attachment (optional &name= sets the
 *   file name).
 * The bucket stays private: the Worker reads it through its binding, so no R2
 * keys are needed here.
 */

const PATH_RE = /^\/galleries\/[0-9a-f-]{36}\/(thumb|web|original)\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|avif)$/
const MAX_TTL = 7 * 24 * 60 * 60 // never accept links valid for more than a week

export default {
  /** @param {Request} request @param {{ MEDIA: R2Bucket, MEDIA_TOKEN_SECRET: string }} env @param {ExecutionContext} ctx */
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") return text(405, "Method not allowed")

    const url = new URL(request.url)
    const path = url.pathname
    const exp = Number(url.searchParams.get("exp"))
    const sig = url.searchParams.get("sig") ?? ""
    const now = Math.floor(Date.now() / 1000)

    if (!PATH_RE.test(path) || !Number.isInteger(exp) || !sig) return text(403, "Forbidden")
    if (exp < now || exp > now + MAX_TTL) return text(403, "Link expired")
    if (!env.MEDIA_TOKEN_SECRET || !(await validSignature(env.MEDIA_TOKEN_SECRET, `${path}:${exp}`, sig))) return text(403, "Forbidden")

    const kind = path.split("/")[3]
    const download = url.searchParams.get("download") === "1"

    // Edge cache for thumbnails and web copies, keyed by path only (the signature was checked above).
    // Originals are large, downloaded rarely and never cached.
    const cacheable = (kind === "web" || kind === "thumb") && !download && request.method === "GET"
    const cacheKey = new Request(`${url.origin}${path}`)
    const cache = caches.default
    if (cacheable) {
      const hit = await cache.match(cacheKey)
      if (hit) return withClientHeaders(hit, exp, now)
    }

    const object = await env.MEDIA.get(path.slice(1))
    if (!object) return text(404, "Not found")

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set("ETag", object.httpEtag)
    headers.set("Content-Length", String(object.size))
    if (!headers.has("Content-Type")) headers.set("Content-Type", "image/jpeg")
    if (download) {
      const name = safeName(url.searchParams.get("name")) ?? path.split("/").pop()
      headers.set("Content-Disposition", `attachment; filename="${name}"`)
    }

    if (cacheable) {
      const [forCache, forClient] = object.body.tee()
      const cached = new Response(forCache, { headers: new Headers(headers) })
      cached.headers.set("Cache-Control", "public, max-age=86400")
      ctx.waitUntil(cache.put(cacheKey, cached))
      return withClientHeaders(new Response(forClient, { headers }), exp, now)
    }
    return withClientHeaders(new Response(request.method === "HEAD" ? null : object.body, { headers }), exp, now)
  },
}

/** Browsers may cache until the link expires, never longer. */
function withClientHeaders(response, exp, now) {
  const res = new Response(response.body, response)
  res.headers.set("Cache-Control", `private, max-age=${Math.max(0, exp - now)}`)
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("X-Content-Type-Options", "nosniff")
  return res
}

async function validSignature(secret, message, sig) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"])
  let bytes
  try {
    bytes = base64urlDecode(sig)
  } catch {
    return false
  }
  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(message))
}

function base64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function safeName(name) {
  if (!name) return null
  const clean = name.replace(/[^\w.\- ]+/g, "_").slice(0, 120).trim()
  return clean || null
}

function text(status, body) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } })
}
