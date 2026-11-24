/** Upload rules shared by the browser (to pre-check files) and the API routes (to enforce them). */

/** Accepted originals and the file extension each is stored under. */
export const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const MAX_ORIGINAL_BYTES = 200 * 1024 * 1024
export const MAX_FILES_PER_BATCH = 50

/** Long edge of the copy clients see, in pixels. */
export const WEB_COPY_EDGE = 2048
export const WEB_COPY_QUALITY = 0.85
