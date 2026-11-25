import "server-only"

import { presignGet } from "@/lib/r2"

/** A photo as the editor's grid shows it. */
export type GridPhoto = { id: string; name: string; src: string | null; status: string; sectionId: string | null }

/**
 * Turn photo rows into what the grid shows, with short-lived photo links for
 * finished uploads. Server-only and not an action: it must never be callable
 * from the browser, because it signs whatever keys it is given.
 */
export async function toGridPhotos(rows: { id: string; original_name: string; web_key: string | null; status: string; section_id: string | null }[]): Promise<GridPhoto[]> {
  return Promise.all(
    rows.map(async (p) => ({
      id: p.id,
      name: p.original_name,
      src: p.status === "ready" && p.web_key ? await presignGet(p.web_key) : null,
      status: p.status,
      sectionId: p.section_id,
    }))
  )
}
