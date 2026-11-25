/** Upload rules shared by the browser (to pre-check files) and the API routes (to enforce them). */

/** Accepted originals and the file extension each is stored under. */
export const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heic",
}

/** Some systems (Windows, older Android) send no type for these, so the extension decides. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
}

/** The accepted MIME type of a file, or null when it isn't a photo we take. */
export function photoTypeOf(file: { name: string; type: string }) {
  if (file.type in ACCEPTED_IMAGE_TYPES) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return TYPE_BY_EXTENSION[ext] ?? null
}

export const ACCEPTED_FORMATS_TEXT = "JPEG, PNG, WebP, AVIF or HEIC"

export const MAX_ORIGINAL_BYTES = 200 * 1024 * 1024
export const MAX_FILES_PER_BATCH = 50

/** Long edge of the copy clients see in the viewer, in pixels. */
export const WEB_COPY_EDGE = 2048
export const WEB_COPY_QUALITY = 0.85

/** Long edge of the grid thumbnail: sharp on 2x screens at grid size, a fraction of the web copy's weight. */
export const THUMB_EDGE = 800
export const THUMB_QUALITY = 0.8
