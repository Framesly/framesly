import "server-only"

import { photoImageUrls } from "@/lib/media"

/** A photo as the editor's grid shows it: the thumbnail, and the web copy to fall back to. */
export type GridPhoto = { id: string; name: string; src: string | null; full: string | null; status: string; sectionId: string | null }

/**
 * Turn photo rows into what the grid shows, with signed media links for
 * finished uploads. Server-only and not an action: it must never be callable
 * from the browser, because it signs whatever keys it is given.
 */
export function toGridPhotos(rows: { id: string; original_name: string; web_key: string | null; status: string; section_id: string | null }[]): GridPhoto[] {
  return rows.map((p) => {
    const urls = p.status === "ready" && p.web_key ? photoImageUrls(p.web_key) : null
    return { id: p.id, name: p.original_name, src: urls?.thumb ?? null, full: urls?.full ?? null, status: p.status, sectionId: p.section_id }
  })
}
