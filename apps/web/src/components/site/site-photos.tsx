"use client"

import { createContext, useContext } from "react"

import type { SitePhotos } from "@/lib/photos"

const SitePhotosContext = createContext<SitePhotos | null>(null)

/** Makes the site photo catalogue (loaded once in the root layout) available to client components. */
export function SitePhotosProvider({ photos, children }: { photos: SitePhotos; children: React.ReactNode }) {
  return <SitePhotosContext.Provider value={photos}>{children}</SitePhotosContext.Provider>
}

export function useSitePhotos(): SitePhotos {
  const photos = useContext(SitePhotosContext)
  if (!photos) throw new Error("useSitePhotos must be used inside SitePhotosProvider")
  return photos
}
