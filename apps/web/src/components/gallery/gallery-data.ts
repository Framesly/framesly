import { showcaseUrl, type Photo, type SitePhotoKey, type SitePhotos } from "@/lib/photos"

export type GalleryPhoto = Photo & {
  frame: number
  section: string
  /** Signed link to the original (live galleries) */
  download?: string
  /** Small grid copy (live galleries); `src` is the full web copy for the viewer */
  thumb?: string
}
export type GallerySection = { id: string; name: string; day: string; photos: GalleryPhoto[] }

/** What the client gallery view renders: the sample gallery or a real published one. */
export type GalleryViewData = {
  studio: {
    name: string
    email?: string | null
    logoUrl?: string | null
    /** The studio's brand colour (hex). The sample gallery has none and keeps the default accent. */
    brandColor?: string | null
  }
  couple: string
  /** Cover: one photo, or a slideshow of the gallery's photos (live galleries) */
  coverMode?: "single" | "slideshow"
  /** Line above the names on the cover, e.g. "Udaipur · 12 to 14 February 2026". */
  subtitle: string
  cover: Photo | null
  sections: GallerySection[]
  all: GalleryPhoto[]
}

const raw: { id: string; name: string; day: string; keys: SitePhotoKey[] }[] = [
  { id: "getting-ready", name: "Getting ready", day: "Day 1 · Morning", keys: ["bridalMirror", "bridalLaugh", "bridalPortrait", "ringHands", "tealDoor"] },
  { id: "mehendi", name: "Mehendi", day: "Day 1 · Evening", keys: ["hennaHands", "afghanLaugh", "emeraldAttire", "shawlCanopy", "pathTogether"] },
  { id: "sangeet", name: "Sangeet", day: "Day 2 · Night", keys: ["tentDance", "dupattaDance", "sunglassesDance", "danceFloor", "brideDance", "familyCheer"] },
  { id: "ceremony", name: "Ceremony", day: "Day 3 · Afternoon", keys: ["baraat", "mandapCouple", "marigoldMandap", "pujaRitual", "anandKaraj", "ceremonyBow", "hallEntrance", "gardenProcession"] },
  { id: "portraits", name: "Portraits", day: "Day 3 · Golden hour", keys: ["gardenArch", "lakeDance", "avenueWalk", "brickArches", "veilLaugh", "steppingStones", "closeEmbrace", "forestPortrait"] },
  { id: "reception", name: "Reception", day: "Day 3 · Night", keys: ["receptionStage", "redAisle", "candleTable", "champagne", "jointLaugh", "nikahCouple"] },
]

/** Fixed details of the demo wedding (no photos), safe for metadata. */
export const sampleGalleryInfo = {
  studio: { name: "Saffron Lane", tagline: "Wedding stories from Udaipur", email: "hello@saffronlane.studio" },
  couple: "Aarohi & Kabir",
  place: "Udaipur",
  dates: "12 to 14 February 2026",
  /** 1200×630 share image, stored next to the showcase photos. */
  shareImage: showcaseUrl("sample-og.jpg"),
}

export type SampleGallery = typeof sampleGalleryInfo & { cover: Photo; sections: GallerySection[]; all: GalleryPhoto[] }

/** The sample gallery, built from the site photo catalogue loaded from Supabase. */
export function buildSampleGallery(photos: SitePhotos): SampleGallery {
  let frame = 1021
  const sections = raw.map<GallerySection>((s) => ({
    id: s.id,
    name: s.name,
    day: s.day,
    photos: s.keys.map((k) => ({ ...photos[k], frame: (frame += 7), section: s.id })),
  }))
  return { ...sampleGalleryInfo, cover: photos.skyEmbrace, sections, all: sections.flatMap((s) => s.photos) }
}
