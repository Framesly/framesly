import { ImageResponse } from "next/og"

import { brandIcon } from "@/lib/brand-icon"

/** The icon iPhones and iPads use when someone adds Framesly to the home screen. */
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(brandIcon(180), size)
}
