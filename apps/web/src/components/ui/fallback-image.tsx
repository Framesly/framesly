"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

/**
 * next/image that switches to `fallback` once if `src` fails to load. Used for
 * grid thumbnails: photos uploaded before thumbnails existed only have the
 * larger web copy.
 */
export function FallbackImage({ src, fallback, alt, onError, ...props }: ImageProps & { fallback?: string | null }) {
  const [failed, setFailed] = useState<ImageProps["src"] | null>(null)
  const current = failed === src && fallback ? fallback : src
  return (
    <Image
      {...props}
      alt={alt}
      src={current}
      onError={(e) => {
        if (fallback && failed !== src) setFailed(src)
        onError?.(e)
      }}
    />
  )
}
