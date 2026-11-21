/**
 * Photography for the marketing site and the sample gallery: real weddings
 * shot by Wow Films (from the studio's shared Google Drive folder). Confirm
 * written permission from the studio, and model releases for any couple shown,
 * before public launch.
 *
 * Each photo lives in /public/photos as WebP at several widths
 * (name-400.webp … name-1800.webp); src points at the base name and the
 * image loader (lib/image-loader.ts) picks the right width for each slot.
 * w and h are the full-size dimensions, used for aspect ratios.
 */
export type Photo = {
  id: string
  src: string
  w: number
  h: number
  alt: string
}

function photo(file: string, w: number, h: number, alt: string): Photo {
  return { id: file, src: `/photos/${file}.webp`, w, h, alt }
}

export const photos = {
  bridalLaugh: photo("bridal-laugh", 1333, 2000, "Bride laughing in a gold-embroidered lehenga, hands covered in henna"),
  mandapCouple: photo("mandap-couple", 2000, 1333, "Bride and groom seated in a red floral mandap, garlanded"),
  hennaHands: photo("henna-hands", 1333, 2000, "Henna-covered hands held up against a blue wall"),
  beachTwirl: photo("beach-twirl", 1333, 2000, "Bride in a white gown twirling with the groom on the shore"),
  forestPortrait: photo("forest-portrait", 1333, 2000, "Couple in a sage lehenga and dark suit in a sunlit forest"),
  avenueWalk: photo("avenue-walk", 1333, 2000, "Bride and groom walking down a tree-lined avenue"),
  pujaRitual: photo("puja-ritual", 2000, 1333, "Groom seated for a puja with the priest and family"),
  bridalMirror: photo("bridal-mirror", 1333, 2000, "Bride holding a mirror while getting ready"),
  ringHands: photo("ring-hands", 1333, 2000, "Bride's hennaed hand with a ring resting on the groom's jacket"),
  bridalPortrait: photo("bridal-portrait", 1333, 2000, "Black and white portrait of a bride in a veil and heavy jewellery"),
  gardenArch: photo("garden-arch", 1333, 2000, "Couple embracing under a green garden archway"),
  anandKaraj: photo("anand-karaj", 1333, 2000, "Sikh bride and groom seated together during the Anand Karaj"),
  gardenProcession: photo("garden-procession", 1333, 2000, "Sikh groom with a kirpan and bride walking through a park"),
  afghanLaugh: photo("afghan-laugh", 1333, 2000, "Couple in green and white Afghan attire laughing together"),
  pathTogether: photo("path-together", 1333, 2000, "Couple in Afghan attire walking away down a garden path"),
  tentDance: photo("tent-dance", 2000, 1333, "Guests dancing under a draped marquee"),
  dupattaDance: photo("dupatta-dance", 2000, 1333, "Women dancing with dupattas raised at the wedding"),
  sunglassesDance: photo("sunglasses-dance", 1333, 2000, "Guest in a tuxedo and sunglasses dancing at the reception"),
  lakeDance: photo("lake-dance", 1333, 2000, "Groom twirling the bride beside a lake"),
  candleTable: photo("candle-table", 2000, 1333, "Candlelit table for two with roses by the water"),
  champagne: photo("champagne", 1333, 2000, "Two bottles of champagne on ice"),
  redAisle: photo("red-aisle", 2000, 1333, "Rows of white chairs along a red petal aisle"),
  brickArches: photo("brick-arches", 1333, 2000, "Bride and groom standing under brick arches"),
  skyEmbrace: photo("sky-embrace", 2000, 1333, "Couple embracing against a wide cloudy sky"),
  tealDoor: photo("teal-door", 1333, 2000, "Bride in an ivory veil beside a teal door"),
  roseBouquet: photo("rose-bouquet", 1333, 2000, "Bride holding a large bouquet of red and white roses"),
  duskShore: photo("dusk-shore", 2000, 1333, "Couple close together by the water at dusk"),
  beachRun: photo("beach-run", 1333, 2000, "Couple running hand in hand along the beach"),
  horseMono: photo("horse-mono", 2000, 1333, "Black and white portrait of a couple beside a horse"),
  heartProposal: photo("heart-proposal", 1333, 2000, "Proposal under a heart of red roses in stone ruins"),
  boatRide: photo("boat-ride", 2000, 1333, "Couple in a small boat on a river"),
  danceFloor: photo("dance-floor", 2000, 1333, "Guests on the dance floor at a Nikah celebration"),
  closeEmbrace: photo("close-embrace", 1333, 2000, "Groom resting his head against the bride's in a close embrace"),
  veilLaugh: photo("veil-laugh", 1333, 2000, "Bride in a lace veil laughing with the groom"),
  shawlCanopy: photo("shawl-canopy", 2000, 1333, "Couple sheltering under an embroidered shawl"),
  emeraldAttire: photo("emerald-attire", 1333, 2000, "Couple in emerald and white Afghan wedding attire"),
  steppingStones: photo("stepping-stones", 1333, 2000, "Couple standing on stepping stones in a pond"),
  receptionStage: photo("reception-stage", 2000, 1333, "Couple seated on a floral reception stage with family"),
  seaBreeze: photo("sea-breeze", 1333, 2000, "Couple cheek to cheek by the sea"),
  redDressKiss: photo("red-dress-kiss", 1333, 2000, "Groom kissing the bride's forehead, bride in red"),
  baraat: photo("baraat", 2000, 1333, "Baraat procession of guests in red and gold"),
  hallEntrance: photo("hall-entrance", 2000, 1333, "Sikh couple walking into the hall past seated guests"),
  ceremonyBow: photo("ceremony-bow", 2000, 1333, "Bride and groom bowing together during the ceremony"),
  familyCheer: photo("family-cheer", 2000, 1333, "Family cheering and dancing around the couple"),
  jointLaugh: photo("joint-laugh", 1333, 2000, "Groom and bride in red laughing together"),
  marigoldMandap: photo("marigold-mandap", 1333, 2000, "Couple seated under a marigold-strung mandap"),
  brideDance: photo("bride-dance", 2000, 1333, "Bride dancing alone in a yellow lehenga"),
  nikahCouple: photo("nikah-couple", 2000, 1467, "Nikah couple in embroidered attire with guests"),
} satisfies Record<string, Photo>

export type PhotoKey = keyof typeof photos
