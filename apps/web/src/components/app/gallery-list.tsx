"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { GalleryCard, type CoverUrls, type GalleryView } from "@/components/app/gallery-card"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import type { GalleryOverview } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

type Status = GalleryOverview["status"]
type Sort = "newest" | "oldest" | "event" | "name" | "photos"
type Item = { gallery: GalleryOverview; cover: CoverUrls | null }

const statusFilters: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "culling", label: "Culling" },
  { value: "delivered", label: "Delivered" },
  { value: "archived", label: "Archived" },
]

const sorters: Record<Sort, (a: GalleryOverview, b: GalleryOverview) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  oldest: (a, b) => a.created_at.localeCompare(b.created_at),
  // Galleries without a date go last.
  event: (a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? "") || b.created_at.localeCompare(a.created_at),
  name: (a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }),
  photos: (a, b) => b.photo_count - a.photo_count,
}

/** Below this many galleries search and filters would be clutter; the view switch always shows. */
const CONTROLS_FROM = 4
const VIEW_KEY = "framesly:gallery-view"

const views: { value: GalleryView; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "large", label: "Large" },
]

function ViewIcon({ view }: { view: GalleryView }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      {view === "grid" && (
        <>
          <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
          <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" />
          <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" />
        </>
      )}
      {view === "list" && <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />}
      {view === "large" && <rect x="3" y="3.5" width="14" height="13" rx="1.5" />}
    </svg>
  )
}

/** Grid, list or large cards, remembered per browser. Storage can be unavailable (private mode), so it is optional. */
const viewListeners = new Set<() => void>()
let memoryView: GalleryView = "grid"
function readView(): GalleryView {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === "grid" || saved === "list" || saved === "large") return saved
  } catch {}
  return memoryView
}
function useGalleryView() {
  const view = useSyncExternalStore(
    (onChange) => {
      viewListeners.add(onChange)
      return () => viewListeners.delete(onChange)
    },
    readView,
    () => "grid" as GalleryView
  )
  const choose = (v: GalleryView) => {
    memoryView = v
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {}
    viewListeners.forEach((l) => l())
  }
  return [view, choose] as const
}

/** The studio's galleries with search, a status filter and sorting. Works on the list the server already loaded. */
export function GalleryList({ items, brandColor }: { items: Item[]; brandColor: string }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<Status | "all">("all")
  const [sort, setSort] = useState<Sort>("newest")
  const [view, setView] = useGalleryView()

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const { gallery } of items) c[gallery.status] = (c[gallery.status] ?? 0) + 1
    return c
  }, [items])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter(({ gallery }) => (status === "all" || gallery.status === status) && (!q || gallery.title.toLowerCase().includes(q)))
      .sort((a, b) => sorters[sort](a.gallery, b.gallery))
  }, [items, query, status, sort])

  const showControls = items.length >= CONTROLS_FROM
  const filtered = query.trim() !== "" || status !== "all"

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="type-caption font-normal text-ink-muted tabular-nums">
          {shown.length === items.length ? `${items.length} ${items.length === 1 ? "gallery" : "galleries"}` : `${shown.length} of ${items.length}`}
        </p>
        <div role="group" aria-label="Layout" className="flex rounded-full border border-line bg-surface-raised p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              aria-label={`${v.label} view`}
              title={`${v.label} view`}
              onClick={() => setView(v.value)}
              className={cn(
                "grid h-9 w-10 place-items-center rounded-full transition-colors",
                view === v.value ? "bg-surface-overlay text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              <ViewIcon view={v.value} />
            </button>
          ))}
        </div>
      </div>
      {showControls && (
        <div className="mb-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <Field label="Search galleries" hideLabel type="search" prefix="Search" placeholder="Couple or gallery name" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
            <Select label="Sort galleries" hideLabel prefix="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="event">Wedding date</option>
              <option value="name">Name, A to Z</option>
              <option value="photos">Most photos</option>
            </Select>
          </div>
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {statusFilters
              .filter((f) => f.value === "all" || counts[f.value])
              .map((f) => {
                const on = status === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStatus(f.value)}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-full border px-4 type-caption transition-colors",
                      on ? "border-safelight bg-safelight-soft text-ink" : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                    )}
                  >
                    {f.label}
                    <span className="type-metric text-caption">{counts[f.value] ?? 0}</span>
                  </button>
                )
              })}
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {shown.length} {shown.length === 1 ? "gallery" : "galleries"} shown
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-[var(--radius-cover)] border border-line bg-surface-raised px-6 py-14 text-center">
          <p className="type-heading-2">No galleries match</p>
          <p className="mt-2 text-ink-muted">{filtered ? "Try a different name or status." : "There are no galleries yet."}</p>
          {filtered && (
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => {
                setQuery("")
                setStatus("all")
              }}
            >
              Clear search and filters
            </Button>
          )}
        </div>
      ) : (
        <ul
          className={cn(
            view === "grid" && "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
            view === "large" && "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
            view === "list" && "divide-y divide-line overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-raised"
          )}
        >
          {shown.map(({ gallery, cover }) => (
            <li key={gallery.id}>
              <GalleryCard gallery={gallery} brandColor={brandColor} cover={cover} view={view} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
