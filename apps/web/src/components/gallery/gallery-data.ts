import { photos, type Photo } from "@/lib/photos"

export type GalleryPhoto = Photo & { frame: number; section: string }
export type GallerySection = { id: string; name: string; day: string; photos: GalleryPhoto[] }

const raw: { id: string; name: string; day: string; keys: (keyof typeof photos)[] }[] = [
  { id: "getting-ready", name: "Getting ready", day: "Day 1 · Morning", keys: ["bridalMirror", "bridalLaugh", "bridalPortrait", "ringHands", "tealDoor"] },
  { id: "mehendi", name: "Mehendi", day: "Day 1 · Evening", keys: ["hennaHands", "afghanLaugh", "emeraldAttire", "shawlCanopy", "pathTogether"] },
  { id: "sangeet", name: "Sangeet", day: "Day 2 · Night", keys: ["tentDance", "dupattaDance", "sunglassesDance", "danceFloor", "brideDance", "familyCheer"] },
  { id: "ceremony", name: "Ceremony", day: "Day 3 · Afternoon", keys: ["baraat", "mandapCouple", "marigoldMandap", "pujaRitual", "anandKaraj", "ceremonyBow", "hallEntrance", "gardenProcession"] },
  { id: "portraits", name: "Portraits", day: "Day 3 · Golden hour", keys: ["gardenArch", "lakeDance", "avenueWalk", "brickArches", "veilLaugh", "steppingStones", "closeEmbrace", "forestPortrait"] },
  { id: "reception", name: "Reception", day: "Day 3 · Night", keys: ["receptionStage", "redAisle", "candleTable", "champagne", "jointLaugh", "nikahCouple"] },
]

let frame = 1021
export const sampleGallery = {
  studio: { name: "Saffron Lane", tagline: "Wedding stories from Udaipur", email: "hello@saffronlane.studio" },
  couple: "Aarohi & Kabir",
  place: "Udaipur",
  dates: "12 to 14 February 2026",
  cover: photos.skyEmbrace,
  sections: raw.map<GallerySection>((s) => ({
    id: s.id,
    name: s.name,
    day: s.day,
    photos: s.keys.map((k) => ({ ...photos[k], frame: (frame += 7), section: s.id })),
  })),
}

export const allSamplePhotos = sampleGallery.sections.flatMap((s) => s.photos)
