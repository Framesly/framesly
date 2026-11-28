import { supabaseUrl } from "@/lib/supabase/env"

/**
 * Site photography (marketing pages, auth pages, sample gallery).
 *
 * The photos themselves live in Supabase: files in Storage
 * (site-media/showcase/{file}-{400|800|1200|1800}.webp) and the catalogue in
 * the public.site_photos table. lib/data/site-photos.ts loads the table and
 * SitePhotosProvider hands it to the components.
 *
 * SITE_PHOTO_KEYS is the contract between code and database: every key here
 * must have an active row, so components can use photos.someKey safely.
 */
export type Photo = {
  id: string
  /** Base URL (…/name.webp); the image loader picks the right width. */
  src: string
  w: number
  h: number
  alt: string
}

export const SITE_PHOTO_KEYS = [
  "bridalLaugh", "mandapCouple", "hennaHands", "beachTwirl", "forestPortrait", "avenueWalk", "pujaRitual",
  "bridalMirror", "ringHands", "bridalPortrait", "anandKaraj", "gardenProcession", "tentDance", "dupattaDance",
  "sunglassesDance", "lakeDance", "candleTable", "champagne", "redAisle", "brickArches", "skyEmbrace", "tealDoor",
  "roseBouquet", "duskShore", "beachRun", "horseMono", "heartProposal", "boatRide", "danceFloor", "closeEmbrace",
  "veilLaugh", "receptionStage", "seaBreeze", "redDressKiss", "baraat", "hallEntrance", "ceremonyBow",
  "familyCheer", "jointLaugh", "marigoldMandap", "brideDance", "nikahCouple", "orchardPath", "cabinLift",
  "prayerSmile", "letterLaugh", "lilacDoorway", "lilacHug", "gurdwaraVows", "gardenBride", "stoneSteps",
  "veilSmile", "veilSilhouette", "forestMono", "forestPair", "forestPairAlt", "haldiColour", "castleCheer",
  "marigoldVows", "bridesmaids", "cakeCut", "auntiesDance", "groomBridge", "cakeBite", "stableKiss", "shoreHug",
  "sandHands", "mehendiSwing", "haldiGroom", "mehendiCouple", "brideSmile", "grillFood", "haldiRitual",
  "guestSelfie", "giftTrays", "sangeetDance", "redDance", "groomDance", "carArrival", "brideFriend",
  "groomBlessing", "ritualElders", "goldenHour", "willowBridge", "bridalHair", "grandpaDance", "castleGate",
  "violinist", "domeProposal", "ringReveal", "proposalHug", "archSeat", "glasshouseProposal", "roseCarry",
  "hedgeEmbrace", "friendsGroup", "colonnade", "earringSmile", "stairSeat", "lakeTwirl", "foreheadTouch",
  "palaceArch", "brickWall", "oldTown", "monoLaugh", "handReach", "carousel", "fountainRun", "courtyardPair",
  "courtyardPairAlt", "lehengaSpread", "greenDoorBride", "lakeDeck", "flowerCanopy", "sparklerEntry",
  "jewelleryTray", "earringClose", "sandPicnic", "candleNight", "parkTwirl", "closeLaugh", "lilacLean", "parkWalk",
  "gurdwaraFamily", "forestWide", "garlandExchange", "partyJoy", "groomShades", "fatherHug", "familyStage",
  "horseNuzzle", "seaWave", "dancerSmile", "danceCircle", "proposalGaze", "laughHug", "ruinGardens",
  "braceletClasp", "whiteDressSmile", "bridalPose", "lakeGaze", "riverRail", "archLounge", "courtyardTrain",
  "groomLaugh", "ritualFire", "clappingGuests", "mehendiStage", "photoBook",
] as const

export type SitePhotoKey = (typeof SITE_PHOTO_KEYS)[number]
export type SitePhotos = Record<SitePhotoKey, Photo>

export const SITE_MEDIA_BUCKET = "site-media"
export const SHOWCASE_FOLDER = "showcase"

/** Public URL of a file in site-media/showcase/. */
export function showcaseUrl(file: string) {
  return `${supabaseUrl}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${SHOWCASE_FOLDER}/${file}`
}
