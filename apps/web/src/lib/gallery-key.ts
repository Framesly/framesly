import "server-only"

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, randomInt } from "node:crypto"

/*
 * Gallery keys (the password a couple types to open a private gallery).
 *
 * Verification uses the bcrypt hash. So the photographer can see and share
 * the key again, it is also stored encrypted with AES-256-GCM. The encryption
 * key is derived from MEDIA_TOKEN_SECRET with HKDF under its own label, so it
 * is independent of the media link signatures and never leaves the server.
 *
 *   cipher = "v1." + base64url(iv[12] | tag[16] | ciphertext)
 */

const VERSION = "v1"

function encryptionKey() {
  const secret = process.env.MEDIA_TOKEN_SECRET
  if (!secret) throw new Error("MEDIA_TOKEN_SECRET is not set.")
  return Buffer.from(hkdfSync("sha256", secret, "framesly", "gallery-key v1", 32))
}

export function encryptGalleryKey(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url")}`
}

/** The key in plain text, or null if there is none or it can't be read (wrong secret, tampered). */
export function decryptGalleryKey(stored: string | null | undefined) {
  if (!stored?.startsWith(`${VERSION}.`)) return null
  try {
    const raw = Buffer.from(stored.slice(VERSION.length + 1), "base64url")
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

/** No 0/O or 1/l/i, so a key read aloud or off a phone is typed right the first time. */
const LETTERS = "abcdefghjkmnpqrstuvwxyz"
const DIGITS = "23456789"

/** A new key like "mrkt-4827": short to type, about 30 bits of randomness (unlock attempts are slowed server-side). */
export function generateGalleryKey() {
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[randomInt(set.length)]).join("")
  return `${pick(LETTERS, 4)}-${pick(DIGITS, 4)}`
}
