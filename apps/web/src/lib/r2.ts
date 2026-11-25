import "server-only"

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/*
 * Cloudflare R2 (S3-compatible). Server-only: the keys never reach the browser.
 * Layout: galleries/{galleryId}/original/{photoId}.{ext}
 *         galleries/{galleryId}/web/{photoId}.jpg
 */

const UPLOAD_URL_TTL = 60 * 60 // 1 hour: enough for a slow card-reader upload
const VIEW_URL_TTL = 60 * 60

let client: S3Client | null = null

function r2() {
  if (client) return client
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.")
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // The SDK's default CRC32 checksums are signed into the URL and R2 rejects the browser's PUT.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
  return client
}

const bucket = () => process.env.R2_BUCKET as string

export const originalKey = (galleryId: string, photoId: string, ext: string) => `galleries/${galleryId}/original/${photoId}.${ext}`
export const webKey = (galleryId: string, photoId: string) => `galleries/${galleryId}/web/${photoId}.jpg`
export const thumbKey = (galleryId: string, photoId: string) => `galleries/${galleryId}/thumb/${photoId}.jpg`

/** A URL the browser can PUT one file to. The content type is part of the signature. */
export function presignPut(key: string, contentType: string) {
  return getSignedUrl(r2(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: UPLOAD_URL_TTL })
}

/** A short-lived URL to show a stored file to a signed-in photographer. */
export function presignGet(key: string) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: VIEW_URL_TTL })
}

/** Size in bytes of a stored object, or null when it isn't there. */
export async function objectSize(key: string): Promise<number | null> {
  try {
    const head = await r2().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
    return head.ContentLength ?? 0
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status === 404) return null
    throw e
  }
}

/** Delete specific stored files (best effort: missing keys are fine). */
export async function deleteKeys(keys: string[]) {
  if (!keys.length) return
  await r2().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }))
}

/** Delete everything stored for one gallery (originals and web copies). */
export async function deleteGalleryObjects(galleryId: string) {
  const Prefix = `galleries/${galleryId}/`
  let ContinuationToken: string | undefined
  do {
    const page = await r2().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix, ContinuationToken }))
    const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key as string }))
    if (keys.length) await r2().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys, Quiet: true } }))
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (ContinuationToken)
}
