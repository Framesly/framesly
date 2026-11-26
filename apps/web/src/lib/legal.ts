/**
 * The versions of the legal documents now in force, as the dates they were
 * last changed. The legal pages show these dates, and every acceptance a
 * photographer gives is recorded against them (legal_acceptances), so change
 * the date here whenever the wording of a document changes.
 */
export const LEGAL_VERSIONS = {
  terms: "2026-11-25",
  privacy: "2026-11-26",
} as const

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** "Last updated 26 November 2026" for a version date. */
export const lastUpdated = (version: string) => `Last updated ${fmt.format(new Date(`${version}T00:00:00Z`))}`
